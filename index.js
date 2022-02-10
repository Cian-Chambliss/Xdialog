exports.convert = function(def,format) {
    var convertXdialogRegion = function(def,terminateWith) {
        var index = 0;
        var startIndex = 0;
        var colsDef = [];
        var colDef = null;
        var colProps = null;
        var rowProps = null;
        var tabPanes = [];
        var tabName  = null;
        var globalProps = { 
            wrap_text : 0 ,
            add_space : 0 ,
            add_linefeed : 0,
            tabDef : null,
            paneDef : null
        };
        var rowDef = [];
        var gitTill = function(text,index,chr) {
            while( index < text.length ) {
                if( text[index] == '\\' ) {
                    if( text[index+1] == chr || text[index+1] == '\\' ) {
                        ++index;
                    }
                } else if( text[index] == chr ) {
                    return index + 1;
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
            var eventPos = def.indexOf("!");
            var condPos = def.indexOf("?");
            var condition = null;
            if( eventPos > 0 ) {
                if( condPos > 0 ) {
                    if( condPos > eventPos ) {
                        settings.event_name = def.substring(eventPos+1,condPos-eventPos-1);
                        settings.condition = def.substring(condPos+1);
                        def = def.substring(0,eventPos);
                        condPos = -1;
                    }
                } else {
                    settings.event_name = def.substring(eventPos+1);
                    def = def.substring(0,eventPos);
                }
            }
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
        };
        var applySettings = function(control,settings) {
            if( settings.condition ) {
                control.condition =  settings.condition;
            }
            if( settings.event_name ) {
                control.event_name =  settings.event_name;
            }
        };
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
                var  subOptions = null;
                if( listIndex < 1 ) {
                    listIndex = fieldDef.indexOf("^#");
                    if( listIndex < 1 ) {
                        listIndex = fieldDef.indexOf("^$");
                        overrideType = "checkbox_listbox";
                    } else {
                        overrideType = "listbox";
                    }
                }
                if( listIndex > 0 ) {
                    variableName = fieldDef.substring(0,listIndex);
                    fieldDef = fieldDef.substring(listIndex+2).trim();
                    if( overrideType == "checkbox_listbox" ) {
                        if( fieldDef[0] == '$' ) {
                            fieldDef = fieldDef.substring(1);
                        } else {
                            subOptions = "LogicalCheckbox";
                        }
                    }
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
            applySettings(control,settings);
            if( subOptions == "LogicalCheckbox" ) {
                control.checkbox_logical = true;
            }
            if( formatSpec ) {
                // TBD parse to flags
                var formats = formatSpec.split(";");
                var imageArg = null;
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
                        } else if( fs[0] == 'd' ) {
                            control.smart = { type : "field" };
                        } else if( fs[0] == 'f' ) {
                            control.smart = { type : "file" };
                            if( fs.indexOf('.') > 0 ) {
                                control.smart.file_types = formats[i].substring(1).split("|");
                            }
                        } else if( fs[0] == 's' ) {
                            // Spinner...
                            fs = fs.substring(1);
                            var spinnerStart = numLength(fs);
                            if( spinnerStart > 0 ) {
                                var subText = fs.substring(0,spinnerStart);
                                fs = fs.substring(spinnerStart);
                                if( fs[0] == ',')
                                    fs = fs.substring(1);
                                spinnerStart = parseInt(subText, 10);
                                var spinnerEnd = numLength(fs);
                                if( spinnerEnd > 0 ) {
                                    subText = fs.substring(0,spinnerEnd);
                                    spinnerEnd = parseInt(subText, 10);
                                    if( spinnerStart < spinnerEnd ) {
                                        control.type = "spinner";
                                        control.min = spinnerStart;
                                        control.max = spinnerEnd;
                                    }
                                }
                            }
                        } else if( fs[0] == 'p' && fs[1] == '=' && fs.length > 2 ) {
                            var popupExpression = formats[i].substring(2);
                            var funcName = popupExpression.indexOf('(');
                            if( funcName > 0 ) {
                                funcName = popupExpression.substring(0,funcName).toLowerCase();
                            } else {
                                funcName = null;
                            }
                            if( funcName == "ui_get_path" ) {
                                control.smart = { type : "get_path" };
                            } else if( funcName == "popup.calendar" ) {
                                control.smart = { type : "calendar" };
                            } else if( funcName == "popup.calculator" ) {
                                control.smart = { type : "calculator" };
                            } else if( funcName == "popup.url" ) {
                                control.smart = { type : "url" };
                            } else if( funcName == "popup.email_a5" || funcName == "popup.email" ) {
                                control.smart = { type : "email" };
                            } else {
                                control.smart = { type : "popup" };
                                control.smart.popup_expression = popupExpression;
                            }
                        } else if( fs[0] == 'i' && fs[1] == '=' && fs.length > 2 ) {
                            imageArg = formats[i].substring(2);
                        } else if( fs == "*" ) {
                            control.autoselect = true;
                        }
                    } else if( controlType == "listbox" ) {
                        if( fs == "e" ) {
                            control.dragsource = true;
                        }
                    }
                }
                if( imageArg != null && control.smart ) {
                    control.smart.button_image = imageArg;
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

            if( buttonDef[0] == '*' ) {
                settings.is_default = true;
                buttonDef = buttonDef.substring(1);
            }
            var size = numLength(buttonDef);
            if( size > 0 ) {
                settings.width = buttonDef.substring(0,size);
                buttonDef = buttonDef.substring(size);
                if( buttonDef[0] == ',' ) {
                    buttonDef = buttonDef.substring(1);
                    size = numLength(buttonDef);
                    if( size > 0 ) {
                        settings.height = buttonDef.substring(0,size);
                        buttonDef = buttonDef.substring(size);
                    }
                }
                if( buttonDef[0] == ':' ) {
                    buttonDef = buttonDef.substring(1);
                }
            }
            var buttonText = buttonDef;
            var buttonControl = {  text : buttonText };
            var controlType = "button";
            var control = { type : controlType , text : buttonText };
            applySettings(control,settings);
            if( settings.is_default ) {
                control.is_default = true;
            }
            if( settings.width ) {
                control.width = settings.width;
            }
            if( settings.height ) {
                control.height = settings.height;
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
            applySettings(control,settings);
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
        };
        var collapseTable = function(tp) {
            if( tp.type == "table" ) {
                if( tp.items && tp.items.length == 1 ) {
                    var row = tp.items[0];
                    if( row.cells && row.cells.length == 1 ) {
                        // TBD merge other settings
                        return row.cells[0];
                    }
                }
            }
            return tp;
        };
        var parseFrame = function(commandName,frameDef,props) {
            var size = numLength(frameDef);
            var frame = { width : 1 , height : 1 , control : { type : "frame" , content : null } };
            if( commandName == "blueframe" ) {
                frame.control.frame_style = "blue";
            }
            if( size > 0 ) {
                frame.width = frameDef.substring(0,size);
                frameDef = frameDef.substring(size);
                if( frameDef[0] == ',' ) {
                    frameDef = frameDef.substring(1);
                    size = numLength(frameDef);
                    if( size > 0 ) {
                        frame.height = frameDef.substring(0,size);
                        frameDef = frameDef.substring(size);
                    }
                }
                if( frameDef[0] == ':' ) {
                    frameDef = frameDef.substring(1);
                }
            }
            if( frameDef && frameDef != "" ) {
                frame.control.text = frameDef;
            }
            commitSpaceBefore(frame.control);
            props.frame = frame;
        };
        var cleanupCommandName = function(commandName) {
            var endOf = commandName.length;
            while( endOf > 1 ) {
                var ch = commandName[endOf-1];
                if( !('0' <= ch && ch <= '9') ) {
                    break;
                }
                --endOf;
            }
            if( endOf < commandName.length ) {
                var prefix = commandName.substring(0,endOf);
                if( prefix == "region" ||  prefix == "endregion" ) {
                    commandName = prefix;
                }
            }

            return commandName;
        }
        var commitPane = function() {
            processColumnChange(colDef);
            if( colDef ) {
                colsDef.push(finalizeColDef());
                colDef = null;
            }
            if( colsDef.length > 0 ) {
                rowDef.push(finalizeRowDef(colsDef));
            }    
            if( rowDef.length > 0 || tabPanes.length > 0 ) {
                var paneSettings = {};
                tabName = processEventAndCondition(tabName,paneSettings);
                var tabPane = { name : tabName , content : { type : "table" , "items" : rowDef }  };
                applySettings(tabPane,paneSettings);
                tabPane.content = collapseTable(tabPane.content);
                tabPanes.push(tabPane);
            }
            rowDef = [];
            colsDef = [];
            colDef = null;
        };
        var processCommand = function(commandDef) {
            var commandName = commandDef.toLowerCase();
            var eqPos = commandDef.indexOf("=");
            var formatSpec = null;
            if( eqPos > 0) {
                commandName = commandDef.substring(0,eqPos);
                commandDef = commandDef.substring(eqPos+1);
                if( commandDef[0] =='%' ) {
                    var endFormat = gitTill(commandDef,1,'%');
                    if( endFormat > 0 ) {
                        formatSpec =  commandDef.substring(1,endFormat-1);
                        commandDef = commandDef.substring(endFormat);
                    }
                }
            }
            commandName = cleanupCommandName(commandName);
            if( commandName == "region" ) {
                return "region";
            }
            if( commandName == "endregion" ) {
                return "endregion";
            }
            if( commandName == "tab" ) {
                globalProps.tabDef = commandDef;
                globalProps.tabFormat = formatSpec;
                return "tab";
            }
            if( commandName == "endtab" ) {
                return "endtab";
            }
            if( commandName == "pane" ) {
                globalProps.paneDef = commandDef;
                return "pane";
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
            if( commandName == "ymargin" ) {
                if( commandDef != "" ) {
                    globalProps.ymargin = parseInt(commandDef, 10);
                }
                return "ymargin";
            }
            if( commandName == "xmargin" ) {
                if( commandDef != "" ) {
                    globalProps.xmargin = parseInt(commandDef, 10);
                }
                return "xmargin";                
            }
            if( commandName == "ysize" ) {
                if( commandDef != "" ) {
                    globalProps.ysize = parseInt(commandDef, 10);
                }
                return "ysize";                
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
            if( commandName == "frame" || commandName == "blueframe" ) {
                parseFrame(commandName,commandDef,globalProps);
                return "frame";
            }
            var control = { type : commandName };
            if( commandName == "image" ) {
                control.name = commandDef;                
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
            return commandName;
        };
        var finalizeColDef = function() {
            if( colDef.span ) {
                var origDef  = colDef;
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
                var commandFormat = def.indexOf("=%",index);
                index = gitTill(def,index,'}');
                if( commandFormat > 0 && commandFormat < index ) {
                    var endFormat = gitTill(def,commandFormat+2,'%');
                    if( endFormat > 0 ) {
                        index = gitTill(def,endFormat,'}');
                    }
                }
                ch = processCommand( def.substring(startIndex+1,index-1) );
                if( ch == "region" ) {
                    var saveFrame = null;                    
                    if( globalProps.frame ) {
                        saveFrame = globalProps.frame;
                        globalProps.frame = null;
                    }
                    var childRegion = convertXdialogRegion(def.substring(index),"endregion");
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
                    if( saveFrame ) {
                        saveFrame.control.content  = colDef;
                        colDef = saveFrame.control;
                    }
                } else if( ch == "tab" ) {
                    var saveFrame = null;
                    var tabDef = globalProps.tabDef;
                    if( globalProps.frame ) {
                        saveFrame = globalProps.frame;
                        globalProps.frame = null;
                    }
                    var childRegion = convertXdialogRegion(def.substring(index),"endtab");
                    index = index + childRegion.index;

                    var tabSettings = {};
                    tabDef = processEventAndCondition(tabDef,tabSettings);
                    childRegion.tree.variable = tabDef;                    
                    applySettings(childRegion.tree,tabSettings);

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
                    if( saveFrame ) {
                        saveFrame.control.content  = colDef;
                        colDef = saveFrame.control;
                    }
                } else if( ch == "pane" && terminateWith == "endtab") { 
                    if( tabName )  {
                        commitPane();
                    }
                    tabName  = globalProps.paneDef;
                } else if( ch == "endregion" && terminateWith == "endregion" ) {
                    break;
                } else if( ch == "endtab" && terminateWith == "endtab" ) {
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
        if( terminateWith == "endtab" ) {
            if( tabName )  {
                commitPane();
            }
            return { tree : { type : "tab" , panes : tabPanes } , index : index };
        } else {
            processColumnChange(colDef);
            if( colDef ) {
                colsDef.push(finalizeColDef());
                colDef = null;
            }
            if( colsDef.length > 0 ) {
                rowDef.push(finalizeRowDef(colsDef));
            }
            var tree = { type : "table" , "items" : rowDef };
            tree = collapseTable(tree);
            return { tree : tree , index : index };
        }
    };
    return convertXdialogRegion(def,null).tree;
}