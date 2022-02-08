exports.convert = function(def,format) {
    var convertXdialogRegion = function(def,regionDepth) {
        var index = 0;
        var startIndex = 0;
        var colsDef = [];
        var colDef = null;
        var colProps = null;
        var rowProps = null;
        var globalProps = { 
            wrap_text : 0 ,
            add_space : 0 ,
            add_linefeed : 0
        };
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
        var commitSpaceBefore = function(control) {           
            if( globalProps.add_linefeed > 0 ) {
                control.top_lines = globalProps.add_linefeed;
                globalProps.add_linefeed = 0;
            }
            if( globalProps.add_space > 0 ) {
                control.left_space = globalProps.add_space;
                globalProps.add_space = 0;
            }
            if( globalProps.initial_focus ) {
                globalProps.initial_focus  =false;
                control.initial_focus = true;
            }
        };
        var processEventAndCondition = function(def,settings) {
            var condPos = def.indexOf("?");
            var condition = null;
            if( condPos > 0 ) {
                settings.condition = def.substring(condPos+1);
                def = def.substring(0,condPos);
            }
            return def;
        }
        var processTextSnippet = function(endIndex) {
            if( startIndex < endIndex ) {
                var subText = def.substring(startIndex, endIndex);
                subText = subText.trim();
                if( subText.length > 0 ) {
                    var control = { type : "text", text : subText };
                    commitSpaceBefore(control);
                    if( globalProps.wrap_text > 0 ) {
                        control.wrap_text =  globalProps.wrap_text;
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
            }
        };
        var processColumnChange = function(control) {
            if( control ) {
                if( globalProps.add_space > 0 ) {
                    control.right_space = globalProps.add_space;
                    globalProps.add_space = 0;
                }
                if( globalProps.add_linefeed > 0 ) {
                    control.bottom_lines = globalProps.add_linefeed;
                    globalProps.add_linefeed = 0;
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
            var settings = {};
            fieldDef = processEventAndCondition(fieldDef,settings);
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
            if( settings.condition ) {
                control.condition =  settings.condition;
            }
            if( formatSpec ) {
                // TBD parse to flags
                var formats = formatSpec.split(";");
                for( var i = 0 ; i < formats.length ; ++i ) {
                    var fs = formats[i].toLowerCase();

                    if( controlType == "edit" ) {
                        if( fs == "m" ) {
                            control.multiline = true;
                        } else if( fs == "w" || fs == "mw" ) {
                            control.multiline = true;
                            control.wordwrap = true;
                        } else if( fs == "k" ) {
                            control.keep_selection_visible = true;
                        } else if( fs == "a" ) {
                            control.allow_tabs = true;
                        } else if( fs == "z" ) {
                            control.zblank = true;
                        } else if( fs == "n" ) {
                            control.defer_update = true;
                        } else if( fs == "r" ) {
                            control.read_only = true;
                        } else if( fs == "^" ) {
                            control.all_caps = true;
                        } else if( fs == "*" ) {
                            control.autoselect = true;
                        }
                    } else if( controlType == "listbox" ) {
                        if( fs == "e" ) {
                            control.dragsource = true;
                        }
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
            var settings = {};
            buttonDef = processEventAndCondition(buttonDef,settings);
            var buttonText = buttonDef;
            var buttonControl = {  text : buttonText };
            var controlType = "button";
            var control = { type : controlType , text : buttonText };
            if( settings.condition ) {
                control.condition =  settings.condition;
            }
            commitSpaceBefore(control);
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
            var settings = {};
            checkboxDef = processEventAndCondition(checkboxDef,settings);
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
            if( settings.condition ) {
                control.condition =  settings.condition;
            }
            commitSpaceBefore(control);
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
            if( commandName == "region" ) {
                return "region";
            }
            if( commandName == "endregion" ) {
                return "endregion";
            }
            if( commandName == "line" ) {
                if( commandDef != "" ) {
                    commandDef = commandDef.split(",");
                    if( commandDef.length > 1 ) {
                        var bottom = parseInt(commandDef[0], 10);
                        var left = parseInt(commandDef[1], 10);
                        if( bottom > 0 ) {
                            if( !rowProps ) {
                                rowProps = {};
                            }
                            rowProps.line_bottom = parseInt(commandDef[0], 10);
                        }
                        if( left > 0 ) {
                            if( !colProps ) {
                                colProps = {};
                            }
                            colProps.line_left = parseInt(commandDef[1], 10);
                        }
                    } else {
                        if( !rowProps ) {
                            rowProps = {};
                        }                        
                        rowProps.line_bottom = parseInt(commandDef[0], 10);
                    }
                } else {
                    if( !rowProps ) {
                        rowProps = {};
                    }                        
                    rowProps.line_bottom = 1;
                }
                return "line";
            }
            if( commandName == "wrap" ) {
                if( commandDef != "" ) {
                    globalProps.wrap_text = parseInt(commandDef, 10);
                }
                return "wrap";
            }
            if( commandName == "sp" ) {
                if( commandDef != "" && commandDef != "sp" ) {
                    if( commandDef.indexOf(".") < 0 ) {
                        globalProps.add_space = parseInt(commandDef, 10);
                    } else {
                        globalProps.add_space = parseFloat(commandDef);
                    }
                } else {
                    globalProps.add_space = 1;
                }
                return "sp";
            }
            if( commandName == "lf" ) {
                if( commandDef != "" && commandDef != "lf" ) {
                    if( commandDef.indexOf(".") < 0 ) {
                        globalProps.add_linefeed = parseInt(commandDef, 10);
                    } else {
                        globalProps.add_linefeed = parseFloat(commandDef);
                    }
                } else {
                    globalProps.add_linefeed = 1;
                }
                return "lf";
            }
            if( commandName == "initial_focus" ) {
                globalProps.initial_focus = true;
                return "initial_focus";
            }
            var control = { type : commandName };
            commitSpaceBefore(control);
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
            return commandName;
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
        };
        var finalizeRowDef = function(colsDef) {
            var rowDef = { type : "row" , cells : colsDef };
            if( rowProps ) {     
                for (const key in rowProps) {
                    rowDef[key] = rowProps[key];
                }       
                rowProps = null;
            }
            if( globalProps.add_linefeed > 0 ) {
                rowDef.top_lines = globalProps.add_linefeed;
                globalProps.add_linefeed = 0;
            }
            return rowDef;
        };
        while( index < def.length ) {
            var ch = def[index];
            if( ch == '{') {    
                processTextSnippet(index);
                startIndex = index;
                index = gitTill(def,index,'}');
                ch = processCommand( def.substring(startIndex+1,index-1) );
                if( ch == "region" ) {
                    var childRegion = convertXdialogRegion(def.substring(index),regionDepth+1);
                    index = index + childRegion.index;
                    if( !colDef ) {
                        colDef = childRegion.tree;
                    } else {
                        if( !colDef.span ) {
                            var firstSpan = colDef;
                            colDef = { span : []};
                            colDef.span.push(firstSpan);
                        }
                        colDef.span.push( childRegion.tree );
                    }                    
                } else if( ch == "endregion" && regionDepth > 0 ) {
                    break;
                }
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
                processColumnChange(colDef);
                if( colDef ) {
                    colsDef.push(finalizeColDef());
                    colDef = null;
                }
                ++index;
                startIndex = index;
            } else if( ch == ';' ) { // col sep
                processTextSnippet(index);
                processColumnChange(colDef);
                if( colDef ) {
                    colsDef.push(finalizeColDef());
                    colDef = null;
                }
                rowDef.push(finalizeRowDef(colsDef));
                colsDef = [];
                ++index;
                startIndex = index;
            } else {
                ++index;
            }
        }
        processColumnChange(colDef);
        if( colDef ) {
            colsDef.push(finalizeColDef());
            colDef = null;
        }
        if( colsDef.length > 0 ) {
            rowDef.push(finalizeRowDef(colsDef));
        }
        var tree = { type : "table" , "items" : rowDef };
        return { tree : tree , index : index };
    };
    return convertXdialogRegion(def).tree;
}