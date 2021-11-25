exports.convert = function(def,format) {
    var index = 0;
    var startIndex = 0;
    var colsDef = [];
    var colDef = null;
    var colProps = null;
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
    var parseItemList = function(text) {
        var startIndex = 0;
        var items = [];
        if( text[0] == '{' )  {
            startIndex = 1;
        }
        var index = startIndex;
        while( index < text.length ) {
            if( text[index] == ',' ) {
                items.push( text.substring(startIndex,index) );
                startIndex = index+1;
            } else if( text[index] == '}' && text[0] == '{' ) {
                items.push( text.substring(startIndex,index) );
                startIndex = index+1;
                return items;
            }
            index = index + 1;
        }
        if( startIndex < index ) {
            items.push( text.substring(startIndex,index) );
        }
        return items;
    }
    var processTextSnippet = function(endIndex) {
        if( startIndex < endIndex ) {
            var subText = def.substring(startIndex, endIndex);
            subText = subText.trim();
            if( subText.length > 0 ) {
                var control = { type : "text", text : subText };
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
        var formatSpec = null;

        if( fieldDef[0] =='%' ) {
            var endFormat = gitTill(fieldDef,1,'%');
            if( endFormat > 0 ) {
                formatSpec =  fieldDef.substring(1,endFormat-1);
                fieldDef = fieldDef.substring(endFormat+1);
            }
        }

        var variableName = fieldDef;
        var size = numLength(fieldDef);
        var limit = 0;
        var width = 0;
        var height = 0;
        var controlType = "edit";
        var listitems = null;
        var choiceVar = null;
        if( size > 0 ) {
            variableName = fieldDef.substring(size);
            size = fieldDef.substring(0,size);
            fieldDef = variableName;
            if( size[0] == '.' ) {
                width = parseInt(size.substring(1), 10);
            } else {
                limit = parseInt(size, 10);
            }
            if( fieldDef[0] == ',' ) {
                size = numLength(fieldDef.substring(1));
                if( size > 0 ) {
                    variableName = fieldDef.substring(size+1);
                    size = fieldDef.substring(1,size+1);
                    fieldDef = variableName;
                    height = parseInt(size, 10);
                }
            }
        }
        if( fieldDef.indexOf("^") > 0 ) {
            var listIndex = fieldDef.indexOf("^=");
            var  overrideType = "dropdown";
            if( listIndex < 1 ) {
                listIndex = fieldDef.indexOf("^#");
                overrideType = "listbox";
            }

            if( listIndex > 0 ) {
                variableName = fieldDef.substring(0,listIndex);
                fieldDef = fieldDef.substring(listIndex+2).trim();
                if( fieldDef[0] == '{') {
                    listitems = parseItemList(fieldDef);
                    controlType = overrideType;
                } else {
                    choiceVar = fieldDef;
                    controlType = overrideType;
                }               
            }
        }
        var control = { type : controlType , variable : variableName };
        if( limit ) {
            control.limit = limit;
        }
        if( width ) {
            control.width = width;
        }
        if( height ) {
            control.height = height;
        }
        if( listitems ) {
            control.items = listitems;
        }
        if( choiceVar ) {
            control.populateFrom = choiceVar;
        }
        if( formatSpec ) {
            // TBD parse to flags
            var formats = formatSpec.split(";");
            for( var i = 0 ; i < formats.length ; ++i ) {
                var fs = formats[i].toLowerCase();
                if( fs == "m" ) {
                    control.multiline = true;
                } else if( fs == "w" || fs == "mw" ) {
                    control.multiline = true;
                    control.wordwrap = true;
                }
            }
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
        var eqPos = checkboxDef.indexOf("=");
        if( eqPos > 0 ) {
            variableName = checkboxDef.substring(0,eqPos);
            checkboxDef = checkboxDef.substring(eqPos+1).trim();
            if( checkboxDef != "" ) {
                controlType = "radio";
            }
        } else {
            var colPos = checkboxDef.indexOf(":");
            if( colPos > 0 ) {
                variableName = checkboxDef.substring(0,colPos);
                checkboxDef = checkboxDef.substring(colPos+1).trim();
                if( checkboxDef != "" ) {
                    controlType = "radio";
                }    
            }
        }

        var control = { type : controlType , variable : variableName };
        if( controlType == "radio" ) {
            radioDef = checkboxDef;
            if(  checkboxDef[0] == '{' && checkboxDef.indexOf("}") > 0 ) {
                control.items = parseItemList(checkboxDef);
            } else {
                control.text = checkboxDef;
            }
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
    }
    var processCommand = function(commandDef) {
        var commandName = commandDef;
        var eqPos = commandDef.indexOf("=");
        if( eqPos > 0) {
            commandName = commandDef.substring(0,eqPos);
            commandDef = commandDef.substring(eqPos+1);
        }
        if( commandName == "line" ) {
            if( !colProps ) {
                colProps = {};
            }
            if( commandDef != "" ) {
                commandDef = commandDef.split(",");
                if( commandDef.length > 1 ) {
                    var bottom = parseInt(commandDef[0], 10);
                    var left = parseInt(commandDef[1], 10);
                    if( bottom > 0 ) {
                        colProps.line_bottom = parseInt(commandDef[0], 10);
                    }
                    if( left > 0 ) {
                        colProps.line_left = parseInt(commandDef[1], 10);
                    }
                } else {
                    colProps.line_bottom = parseInt(commandDef[0], 10);
                }
            } else {
                colProps.line_bottom = 1;
            }
            return;
        }
        var control = { type : commandName };
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
    var finalizeColDef = function() {
        if( colDef.span ) {
            colDef = { type : "span" , items : colDef.span };
        }
        if( colProps ) {     
            for (const key in colProps) {
                colDef[key] = colProps[key];
            }       
            colProps = null;
        }
        return colDef;
    }
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
                colsDef.push(finalizeColDef());
                colDef = null;
            }
            ++index;
            startIndex = index;
        } else if( ch == ';' ) { // col sep
            processTextSnippet(index);
            if( colDef ) {
                colsDef.push(finalizeColDef());
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
        colsDef.push(finalizeColDef());
        colDef = null;
    }
    if( colsDef.length > 0 ) {
        rowDef.push(colsDef);       
    }
    return { type : "table" , "items" : rowDef };
}