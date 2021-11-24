exports.convert = function(def,format) {
    var index = 0;
    var startIndex = 0;
    var colsDef = [];
    var colDef = null;
    var rowDef = [];
    var gitTill = function(text,index,chr) {
        while( index < text.length ) {
            if( text[index] == chr ) {
                return index+1;
            }
            ++index;
        }
        return index;
    };
    var processTextSnippet = function(endIndex) {
        if( startIndex < endIndex ) {
            var subText = def.substring(startIndex, endIndex);
            subText = subText.trim();
            if( subText.length > 0 ) {
                var control = { text : subText };
                if( !colDef ) {
                    colDef = control;
                } else {
                    if( !colDef.span ) {
                        var firstSpan = colDef;
                        colDef = { span : []};
                        colDef.span.push(firstSpan);
                    }
                    colDef.span.push( control );
                }
            }
        }
    };
    var processField = function(fieldDef) {
        var control = { field : fieldDef };
        if( !colDef ) {
            colDef = control;
        } else {
            if( !colDef.span ) {
                var firstSpan = colDef;
                colDef = { span : []};
                colDef.span.push(firstSpan);
            }
            colDef.span.push( control );
        }        
    };
    var processButton = function(buttonDef) {
        var control = { button : buttonDef };
        if( !colDef ) {
            colDef = control;
        } else {
            if( !colDef.span ) {
                var firstSpan = colDef;
                colDef = { span : []};
                colDef.span.push(firstSpan);
            }
            colDef.span.push( control );
        }        
    };
    var processCommand = function(commandDef) {
        var control = { command : commandDef };
        if( !colDef ) {
            colDef = control;
        } else {
            if( !colDef.span ) {
                var firstSpan = colDef;
                colDef = { span : []};
                colDef.span.push(firstSpan);
            }
            colDef.span.push( control );
        }        
    };
    while( index < def.length ) {
        var ch = def[index];
        if( ch == '{') {    
            processTextSnippet(index);
            startIndex = index;
            index = gitTill(def,index,'}');
            processCommand( def.substring(startIndex,index) );
            startIndex = index;
            continue;
        } else if( ch == '[') {            
            processTextSnippet(index);
            startIndex = index;
            if( index+3 < def.length && def[index+1] =='%' ) {
                index = gitTill(def,index+2,'%');
            }
            index = gitTill(def,index,']');
            processField( def.substring(startIndex,index) );
            startIndex = index;
            continue;
        } else if( ch == '<') {
            processTextSnippet(index);
            startIndex = index;
            index = gitTill(def,index,'>');
            processButton( def.substring(startIndex,index) );
            startIndex = index;
            continue;
        } else if( ch == '|' ) { // row sep
            processTextSnippet(index);
            if( colDef ) {
                colsDef.push(colDef);
                colDef = null;
            }
            ++index;
            startIndex = index;
        } else if( ch == ';' ) { // col sep
            processTextSnippet(index);
            if( colDef ) {
                colsDef.push(colDef);
                colDef = null;
            }
            rowDef.push(colsDef);       
            colsDef = [];
            ++index;
            startIndex = index;
        } else {
            ++index;
        }
    }
    if( colDef ) {
        colsDef.push(colDef);
        colDef = null;
    }
    if( colsDef.length > 0 ) {
        rowDef.push(colsDef);       
    }
    return { "rows" : rowDef };
}