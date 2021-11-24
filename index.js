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
    var numLength = function(text) {
        var length = 0;
        while( ('0' <= text[length] && text[length] <= '9') || text[length] == '.' )
            ++length;
        return length;
    }
    var processField = function(fieldDef) {
        var variableName = fieldDef;
        var size = numLength(fieldDef);
        var limit = 0;
        var width = 0;
        var controlType = "edit";
        if( size > 0 ) {
            variableName = fieldDef.substring(size);
            size = fieldDef.substring(0,size);
            if( size[0] == '.' ) {
                width = parseInt(size.substring(1), 10);
            } else {
                limit = parseInt(size, 10);
            }
        }
        var control = { type : controlType , variable : variableName };
        if( limit ) {
            control.limit = limit;
        }
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
        var buttonText = buttonDef;
        var buttonControl = {  text : buttonText };
        var controlType = "button";
        var control = { type : controlType , text : buttonText };
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
    var processCheckbox = function(checkboxDef) {
        var variableName = checkboxDef;
        var controlType = "checkbox";
        var control = { type : controlType , variable : variableName };
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
            processCommand( def.substring(startIndex+1,index-1) );
            startIndex = index;
            continue;
        } else if( ch == '[') {            
            processTextSnippet(index);
            startIndex = index;
            if( index+3 < def.length && def[index+1] =='%' ) {
                index = gitTill(def,index+2,'%');
            }
            index = gitTill(def,index,']');
            processField( def.substring(startIndex+1,index-1) );
            startIndex = index;
            continue;
        } else if( ch == '<') {
            processTextSnippet(index);
            startIndex = index;
            index = gitTill(def,index,'>');
            processButton( def.substring(startIndex+1,index-1) );
            startIndex = index;
            continue;
        } else if( ch == '(') {
            processTextSnippet(index);
            startIndex = index;
            index = gitTill(def,index,')');
            processCheckbox( def.substring(startIndex+1,index-1) );
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