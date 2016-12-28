/*
 * Demo: http://amirkabirdataminers.github.io/ADM-treeView
 *
 * @version 1.0.0
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
            },
            require: 'ngModel',
            templateUrl: '/src/ADM-treeView.html',
            link: function (scope, element, attrs, ngModel) {
                
                scope.options = angular.extend({}, ADMtrv.getOptions(), scope.configs || {});
                scope.options.dictionary = angular.extend({}, ADMtrv.getOptions().dictionary, scope.configs.dictionary || {});
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