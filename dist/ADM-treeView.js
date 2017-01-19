/*
 * Demo: http://amirkabirdataminers.github.io/ADM-treeView
 *
 * @version 1.0.3
 *
 * © 2016 Amirkabir Data Miners <info@adm-co.net> - www.adm-co.net
 */

(function(angular) {
    'use strict';
    
    Array.prototype.loop = function (operation, reverse) {
        var l = this.length;
        while (l--) {
            var i = this.length - l - 1;
            var j = (reverse ? (l - 1 + 1) : i);
            if (operation(this[j], i) === false) break;
        }
    };
    
    var __ = function (obj, str) {
        var result = obj;
        var keys = str.split(/[.]/g);
        while (!keys[0] && keys.length) keys.shift();
        keys.loop(function (item) {
            if (result === undefined) return false;
            result = result[item];
        });
        return result;
    };

    var findIndex = function(array, item, trackBy) {
        if (!array || !(array instanceof Array) || !array.length) return -1;
        
        if (trackBy) {
            for (var i=0, j=array.length; i<j; i++) {
                var valuInArray = __(array[i], trackBy);
                var valuInItem = __(item, trackBy);
                if (valuInArray == valuInItem) return i;
            }
            return -1;
        }
        else return array.indexOf(item);        
    }

    var isPromise = function(obj) {
        if (typeof obj !== 'object' || !angular.isFunction(obj.then)) return false;
        return true;
    }
    
    var teEnter = function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.teEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    }
    
    var teFocus = function($timeout) {
        return function(scope, element, attrs, ngModel) {
            attrs.$observe("teFocus", function(_newVal) {
                scope.$applyAsync(function() {
                    if ((typeof _newVal == 'string' && _newVal.length == 7 && _newVal.substr(0, 1) == '#') || scope.$eval(_newVal))
                        $timeout(function() {
                            element[0].focus();
                        }, 100);
                });
            });
        };
    }
    
    var teTemplate = function($compile) {
        return function(scope, element, attrs) {
            attrs.$observe("teTemplate", function(val) {
                scope.$applyAsync(function() {
                    element.html(val);
                    $compile(element.contents())(scope);
                });
            });

        }
    }
    
    var teLoading = function($compile) {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                var small = (angular.isDefined(attrs.small) ? ' small' : '');
                var tpl = angular.element('<span class="te-loading disable' + small + '" ng-hide="!loading"><svg class="te-i noI te-i-spin" viewBox="0 0 24 24"><use xlink:href="#te-i-autorenew" /></svg></span>');
                element.append(tpl);

                scope.$applyAsync(function () {
                    $compile(tpl)(scope);
                    setTimeout(function () {
                        tpl.removeClass('disable');
                    }, 100);
                });

                attrs.$observe("teLoading", function (_newVal) {
                    scope.$evalAsync(function () {
                        if (scope.$eval(_newVal))
                            scope.loading = true;
                        else
                            scope.loading = false;
                    });
                });
            }
        };
    }

    
    var ADMtrvProvider = function() {

        var options = {
            childName: 'childs',
            title: '$item.title',
            kidType: '',
            selectable: false,
            readOnly: false,
            trackBy: '',
            maxDepth: 9999,
            direction: 'ltr',
            dictionary: {
                noItem: 'No item!',
                titlePlaceholder: 'Title ...',
                rootAddBtn: 'Add item',
                confirmBtn: 'Confirm',
                cancelBtn: 'Cancel'
            }
        };

        var ADMtrv = {
            getOptions: function(type) {
                var typeOptions = type && options[type] || options;
                return typeOptions;
            }
        };

        this.setConfigs = function(type, customOptions) {
            if (!customOptions) {
                type.dictionary = angular.extend(options.dictionary, type.dictionary || {});
                angular.extend(options, type);
                return;
            }
            options[type] = angular.extend(options[type] || {}, customOptions);
        };

        this.$get = function() {
            return ADMtrv;
        };

    };
 
    
    var ADMtrvDirective = function (ADMtrv, constants, $q, $http) {
        return {
            scope: {
                configs: '=',
                selected: '=?',
                api: '=?'
            },
            require: 'ngModel',
            template: '<div class="treeEditor relCenter" ng-if="ctrl.model" ng-class="[{notEditable: options.readOnly}, options.direction]" ng-init="$depth=0; $item={};"> <ul class="te-ui te-repeatAnim enterOnly"> <p class="te-empty main" ng-class="{active: !ctrl.model.length}"> <svg class="te-i noI" viewBox="0 0 24 24"><use xlink:href="#te-i-error"/></svg>{{options.dictionary.noItem}}</p><li ng-init="$depth=$parent.$depth && $parent.$depth + 1 || 1; $open=false; $item.add=false;" ng-repeat="node in ctrl.model track by $index" ng-include="\'treeEditorChild.html\'"></li><div class="te-add" ng-show="$depth < options.maxDepth"> <div class="te-add-btn" ng-show="!$item.add && !options.singleRoot" ng-click="$item.add=true"> <svg class="te-i noI" viewBox="0 0 24 24"><use xlink:href="#te-i-add"/></svg>{{options.dictionary.rootAddBtn}}</div><div class="add" ng-show="$item.add"> <input type="text" placeholder="{{options.dictionary.titlePlaceholder}}" te-focus="{{$item.add}}" ng-model="$item.newItem" te-enter="add(ctrl.model, $item, $parent);"/> <svg class="te-i te-c-success" viewBox="0 0 24 24" ng-click="add(ctrl.model, $item, $parent);"><use xlink:href="#te-i-check"/></svg> <svg class="te-i" viewBox="0 0 24 24" ng-click="$item.newItem=\'\'; $item.add=false;"><use xlink:href="#te-i-clear"/></svg> </div></div></ul></div><script type="text/ng-template" id="treeEditorChild.html"> <div class="te-header" ng-click="(!$item.edit && canBeOpen(node, $depth)?$open=!$open:kidOpen(node, $item))"> <span class="te-selectable" ng-show="options.selectable" ng-click="toggle(node, $event)"> <div class="te-checkbox" ng-class="{checked: exists(node)}"><div></div></div><span>{{grabTitle(node)}}</span> </span> <span ng-show="!$item.edit && !options.selectable">{{grabTitle(node)}}</span> <span ng-show="$item.edit" class="edit" ng-init=""> <svg class="te-i te-c-success" viewBox="0 0 24 24" ng-click="edit(node, $item, $parent.$parent, $index, $event);"><use xlink:href="#te-i-check"/></svg> <svg class="te-i" viewBox="0 0 24 24" ng-click="cancelEdit($item, $event)"><use xlink:href="#te-i-clear"/></svg> <input type="text" placeholder="{{options.dictionary.titlePlaceholder}}" te-focus="{{$item.add}}" ng-model="$item.editItem" te-enter="edit(node, $item, $parent.$parent, $index);"/> </span> </div><div class="te-toolbar" ng-init="initItem(node); $item={};" id="te-node-{{node.id}}"> <svg class="te-i" viewBox="0 0 24 24" ng-class="{deg90: $open}" ng-show="canBeOpen(node, $depth)" ng-click="$open=!$open"><use xlink:href="#te-i-chevron-right"/></svg> <svg class="te-i" viewBox="0 0 24 24" ng-hide="$item.edit || $depth==1 && options.singleRoot" ng-click="$item.edit=true; $item.editItem=grabTitle(node);"><use xlink:href="#te-i-mode-edit"/></svg> <svg class="te-i" viewBox="0 0 24 24" ng-hide="$depth==1 && options.singleRoot || $item.deleteConfirm" ng-click="$item.deleteConfirm=true;"><use xlink:href="#te-i-delete"/></svg> <span class="deleteConfirm" ng-show="$item.deleteConfirm"> <span ng-click="$item.deleteConfirm=false;">{{options.dictionary.cancelBtn}}</span> <span ng-click="$open=false; delete($item, $parent, $event);">{{options.dictionary.confirmBtn}}</span> </span> <svg class="te-i te-c-success" viewBox="0 0 24 24" ng-show="!$item.add && depthValid($depth)" ng-click="$item.add=true; $open=true;"><use xlink:href="#te-i-add"/></svg> </div><div class="te-kidContent" ng-show="canShowKidContent($item, node)" te-loading="{{$item.kidContentLoading}}" small> <div class="te-ngIfAnim enterOnly" ng-if="$item.kidContent" te-template="{{$item.kidContent}}"></div></div><p class="te-empty" ng-class="{active: $open && (!node[$chn] || !node[$chn].length)}"><svg class="te-i noI" viewBox="0 0 24 24"><use xlink:href="#te-i-error"/></svg>{{options.dictionary.noItem}}</p><ul class="te-ui te-repeatAnim enterOnly" ng-if="$open && node[$chn]"> <li ng-init="$depth=$parent.$depth && $parent.$depth + 1 || 1; $open=false;" ng-repeat="node in node[$chn] track by $index" ng-include="\'treeEditorChild.html\'"></li></ul> <div class="te-add" ng-show="$open && $item.add"> <div class="add"> <input type="text" placeholder="{{options.dictionary.titlePlaceholder}}" te-focus="{{$item.add}}" ng-model="$item.newItem" te-enter="add(node[$chn], $item, $parent);"/> <svg class="te-i te-c-success" viewBox="0 0 24 24" ng-click="add(node[$chn], $item, $parent);"><use xlink:href="#te-i-check"/></svg> <svg class="te-i" viewBox="0 0 24 24" ng-click="$item.newItem=\'\'; $item.add=false;"><use xlink:href="#te-i-clear"/></svg> </div></div></script><svg style="display:none;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"> <defs> <g id="te-i-add"> <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/> <path d="M0 0h24v24H0z" fill="none"/> </g> <g id="te-i-error"> <path d="M0 0h24v24H0z" fill="none"/> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/> </g> <g id="te-i-chevron-right"> <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/> <path d="M0 0h24v24H0z" fill="none"/> </g> <g id="te-i-mode-edit"> <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/> <path d="M0 0h24v24H0z" fill="none"/> </g> <g id="te-i-delete"> <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/> <path d="M0 0h24v24H0z" fill="none"/> </g> <g id="te-i-check"> <path d="M0 0h24v24H0z" fill="none"/> <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/> </g> <g id="te-i-clear"> <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/> <path d="M0 0h24v24H0z" fill="none"/> </g> <g id="te-i-autorenew"> <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/> <path d="M0 0h24v24H0z" fill="none"/> </g> </defs></svg>',
            //templateUrl: '/src/ADM-treeView.html',
            link: function (scope, element, attrs, ngModel) {
                
                scope.options = angular.extend({}, ADMtrv.getOptions(), scope.configs || {});
                scope.options.dictionary = angular.extend({}, ADMtrv.getOptions().dictionary, (scope.configs || {}).dictionary || {});
                scope.options.trackBy = scope.options.trackBy.replace('$item.', '');
                scope.options.readOnly = scope.options.readOnly || scope.options.selectable;

                scope.ctrl = {
                    model: [],
                    selected: []
                }

                scope.$chn = scope.options.childName;

                scope.grabTitle = function (node) {
                    var childList = scope.options.title.replace('$item.', '');
                    return __(node, childList);
                }

                var createObj = function (value, str) {
                    var result = {};
                    var childList = str.replace('$item.', '');
                    var keys = childList.split(/[.]/g);
                    while (!keys[0] && keys.length) keys.shift();
                    keys.loop(function (item, i) {
                        var tmp = {};
                        value = (i ? result : value);
                        tmp[item] = value;
                        result = tmp;
                    }, true);
                    return result;
                }

                scope.depthValid = function (depth) {
                    return depth < scope.options.maxDepth;
                }

                scope.canBeOpen = function (item, depth) {
                    return (!scope.options.readOnly || scope.options.readOnly && item[scope.$chn] && item[scope.$chn].length) && scope.depthValid(depth);
                }
                
                scope.canShowKidContent = function(item, node) {
                    return (item.kidContent || item.kidContentLoading) && (!node[scope.$chn] || node[scope.$chn] && !node[scope.$chn].length);
                }

                var onKidOpen = function(item, content) {
                    scope.$applyAsync(function () {
                        item.kidContent = content;
                        item.kidContentLoading = false;
                    });
                }
                
                scope.kidOpen = function (node, item) {
                    scope.$applyAsync(function () {
                        if (item.kidContent) {
                            item.kidContent = '';
                            item.kidContentLoading = false;
                        } else if (scope.options.onKidOpen) {
                            var result = scope.options.onKidOpen(node);
                            if (isPromise(result)) {
                                item.kidContentLoading = true;
                                $q.when(result).then(function (res) {
                                    onKidOpen(item, res);
                                });
                            }
                            else if (typeof result === 'string')
                                onKidOpen(item, result);
                        }
                    });
                }

                var onAdd = function (nodes, item) {
                    nodes.push(item);
                    upadteModel();
                }

                scope.add = function (nodes, item, parent) {
                    if (!item.newItem.replace(/ /g, '')) return;
                    if (!(nodes instanceof Array))
                        nodes = [];
                    var newItem = createObj(item.newItem, scope.options.title);
                    var parentNode = angular.copy(parent.node);
                    if (parentNode) parentNode[scope.$chn].push(newItem);

                    if (scope.options.onAdd) {
                        var result = scope.options.onAdd(parentNode, newItem, item.newItem);
                        if (isPromise(result))
                            $q.when(result).then(function (res) {
                                if (res) onAdd(nodes, angular.extend({}, newItem, (res === true ? {} : res)));
                            });
                        else if (result !== false)
                            onAdd(nodes, newItem);
                    } else
                        onAdd(nodes, newItem);

                    item.add = false;
                    item.newItem = '';
                }

                var onEdit = function (node, item) {
                    angular.extend(node, createObj(item.editItem, scope.options.title));
                    upadteModel();
                }

                scope.edit = function (node, item, parent, idx, $event) {
                    if ($event) $event.stopPropagation();
                    item.edit = false;

                    var newItem = angular.extend(angular.copy(node), createObj(item.editItem, scope.options.title));
                    var parentNode = angular.copy(parent.$parent.node);
                    if (parentNode) parentNode[scope.$chn][idx] = newItem;

                    if (scope.options.onEdit) {
                        var result = scope.options.onEdit(newItem, parentNode);
                        if (isPromise(result))
                            $q.when(result).then(function (res) {
                                if (res) onEdit(node, item);
                            });
                        else if (result !== false)
                            onEdit(node, item);
                    } else
                        onEdit(node, item);
                }
                
                scope.cancelEdit = function(item, $event) {
                    if ($event) $event.stopPropagation();
                    item.edit = false;
                }

                var onDelete = function (parent) {
                    if (parent.$depth == 1)
                        scope.ctrl.model.splice(parent.$index, 1);
                    else
                        parent.$parent.node[scope.$chn].splice(parent.$index, 1);

                    upadteModel();
                }

                scope.delete = function(item, parent, ev) {
                    item.deleteConfirm = false;

                    var deletedItem, parentNode = angular.copy(parent.$parent.node);

                    if (parentNode)
                        deletedItem = parentNode[scope.$chn].splice(parent.$index, 1)[0];
                    else
                        deletedItem = scope.ctrl.model[parent.$index];

                    if (scope.options.onDelete) {
                        var result = scope.options.onDelete(deletedItem, parentNode);
                        if (isPromise(result))
                            $q.when(result).then(function (res) {
                                if (res) onDelete(parent);
                            });
                        else if (result !== false)
                            onDelete(parent);
                    } else
                        onDelete(parent);
                }

                scope.initItem = function (node) {
                    node[scope.options.childName] = node[scope.options.childName] || [];
                }

                scope.toggle = function (item, $event) {
                    if ($event) $event.stopPropagation();
                    if (!scope.selected) scope.selected = [];
                    var idx = findIndex(scope.selected, item, scope.options.trackBy);
                    return (idx > -1 ? (scope.selected.splice(idx, 1)) : (scope.selected.push(item)));
                };

                scope.exists = function (item) {
                    return findIndex(scope.selected, item, scope.options.trackBy) > -1;
                };


                var upadteModel = function (model) {
                    scope.$evalAsync(function () {
                        scope.ctrl.model = model || scope.ctrl.model;

                        ngModel.$setViewValue(scope.ctrl.model);
                        ngModel.$render();
                    });
                }

                var parser = function (val) {
                    if (!val) return val;
                    upadteModel(val);
                    return val;
                };

                ngModel.$formatters.push(parser);

            }
        }
    }
    
    var ADMtrvConfig = function(ADMtrv) {
        ADMtrv.setConfigs({isDeviceTouch: ('ontouchstart' in window || navigator.maxTouchPoints)});
    }
    
    return angular.module('ADM-treeView', [])
        .constant('constants', {
            
        })
        .provider('ADMtrv', ADMtrvProvider)
        //.filter('digitType', [ADMtrvDigitTypeFilter])
        //.factory('ADMtrvConvertor', [ADMtrvConvertor])
        //.factory('ADMtrvFactory', ['ADMtrvConvertor', ADMtrvFactory])
        .directive('teFocus', ['$timeout', teFocus])
        .directive('teEnter', [teEnter])
        .directive('teTemplate', ['$compile', teTemplate])
        .directive('teLoading', ['$compile', teLoading])
        .directive('admTrv', ['ADMtrv', 'constants', '$q', '$http', ADMtrvDirective])
        //.directive('admtrvCalendar', ['ADMtrv', 'ADMtrvConvertor', 'ADMtrvFactory', 'constants', '$timeout', ADMtrvCalendarDirective])
        //.directive('clickOut', ['$document', clickOutside])
        .config(['ADMtrvProvider', ADMtrvConfig]);
    
}(window.angular));