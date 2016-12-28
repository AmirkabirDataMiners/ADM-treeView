angular.module("app", [
    'ngAnimate',
    'ADM-treeView'
])
.config(['ADMtrvProvider', function(ADMtrv) {
    ADMtrv.setConfigs({
        // Custom configs ...
    });
}])
.filter('sce', ['$sce', function ($sce) {
    return $sce.trustAsHtml;
}])
.controller("bodyCtrl", ['$scope', '$q', function($scope, $q) {

    Prism.plugins.NormalizeWhitespace.setDefaults({
        'remove-initial-line-feed': true,
    });
    
    $scope.ctrl = {};
    
    $scope.availableOptions = [
        {name:'childName', type:'String', default:'childs', description:"Set the name of childs wrapper. (e.g. 'childs', 'categories', ...)"},
        {name:'title', type:'String', default:'$item.title', description:"Set path to 'title'. '$item' can be ignore and path can be nested. (e.g. '$item.titleHolder1.titleHolder2.title') "},
        {name:'singleRoot', type:'Boolean', default:'False', description:"When it's true only one main root can be add."},
        {name:'readOnly', type:'Boolean', default:'False', description:"This option disable add, edit and delete methods."},
        {name:'selectable', type:'Boolean', default:'False', description:"Add checkbox before title to enable multi selecting."},
        {name:'trackBy', type:'String', default:'--', description:"For selectable mode, can be useful for finding items. '$item' can be ignore and path can be nested. (e.g. '$item.mainDS.id')"},
        {name:'maxDepth', type:'Number', default:'--', description:"Set maxDepth for treeView."},
        {name:'direction', type:'String', default:'ltr', description:"Change treeView direction. (e.g. 'ltr', 'rtl')"},
        {name:'dictionary', type:'Object', default:'(EN)', description:"Change buttons and placeholders name upon your language. Check the Docs below."},
        {name:'onKidOpen', type:'Function', default:'--', description:"Pass HTML content to show it on leaf clicking. accept both 'string' and 'promise' to fill the content."},
        {name:'onAdd', type:'Function', default:'--', description:"Event on adding item to tree. Can return promise to wait for server response and add server 'id' to object."},
        {name:'onEdit', type:'Function', default:'--', description:"Event on editing item. Can return promise to wait for server response."},
        {name:'onDelete', type:'Function', default:'--', description:"Event on deleting item. Can return promise to wait for server response."},
    ];
    
    var fakePromise = function(data, delay) {
        var deferred = $q.defer();
        setTimeout(function() {
            deferred.resolve(data);
        }, delay);
        return deferred.promise;
    }
    
    $scope.ctrl.model1 = [
        {
            title: 'Level-1',
            levels: [
                {
                    title: 'Level-1-1',
                    levels: [
                        {title: 'Level-1-1-1'},
                        {title: 'Level-1-1-2'}
                    ]
                },
                {title: 'Level-1-2'}
            ]
        },
        {title: 'Level-2'},
        {title: 'Level-3'}
    ];
    $scope.tree1Options = {
        childName: 'levels',
    };
    

    $scope.ctrl.model2 = [
        {title: 'Papa Category'}
    ];
    $scope.tree2Options = {
        childName: 'categories',
        maxDepth: 2,
        singleRoot: true
    };
    $scope.tree2_2Options = {
        childName: 'categories',
        readOnly: true,
        onKidOpen: function(node) {
            var deferred = $q.defer();
            setTimeout(function() {
                deferred.resolve('The Node title is: "' + node.title + '"');
            }, 2000);
            return deferred.promise;
        }
    }
    
    
    $scope.tree3_1Options = {
        childName: 'organizations',
        dictionary: {
            titlePlaceholder: 'A-Z only ...'
        },
        onAdd: function(parentNode, newNode, titleOnly) {
            return !/[^a-zA-Z]/.test(titleOnly);
        }
    }
    $scope.tree3_2Options = {
        childName: 'organizations',
        onAdd: function(parentNode, newNode, titleOnly) {
            var deferred = $q.defer();
            setTimeout(function() {
                deferred.resolve({
                    id: Math.floor(Math.random() * 1000)
                });
            }, 500);
            return deferred.promise;
        }
    }
    
    
    $scope.ctrl.model4_1 = [
        {
            title: 'bAghAli-1',
            bAghAlies: [
                {
                    title: 'bAghAli-1-1',
                    bAghAlies: [
                        {title: 'bAghAli-1-1-1'},
                        {title: 'bAghAli-1-1-2'}
                    ]
                },
                {title: 'bAghAli-1-2'}
            ]
        },
        {title: 'bAghAli-2'},
        {title: 'bAghAli-3'}
    ];
    $scope.ctrl.model4_1Selected = [];
    $scope.tree4_1Options = {
        childName: 'bAghAlies',
        selectable: true
    }
    
    $scope.ctrl.model4_2 = [
        {
            
            mainBAghAliDS: {
                title: 'bAghAli-1',
                id: 1
            },
            bAghAlies: [
                {
                    mainBAghAliDS: {
                        title: 'bAghAli-1-1',
                        id: 11
                    },
                    bAghAlies: [
                        {
                            mainBAghAliDS: {
                                title: 'bAghAli-1-1-1',
                                id: 111
                            }
                        },
                        {
                            mainBAghAliDS: {
                                title: 'bAghAli-1-1-2',
                                id: 112
                            } 
                        }
                    ]
                },
                {
                    mainBAghAliDS: {
                        title: 'bAghAli-1-2',
                        id: 12
                    }
                }
            ]
        },
        {
            mainBAghAliDS: {
                title: 'bAghAli-2',
                id: 2
            }
        },
        {
            mainBAghAliDS: {
                title: 'bAghAli-3',
                id: 3
            }
        }
    ];
    $scope.ctrl.model4_2Selected = [];
    $scope.tree4_2Options = {
        childName: 'bAghAlies',
        title: '$item.mainBAghAliDS.title',
        trackBy: '$item.mainBAghAliDS.id',
        selectable: true
    }
    
    $scope.tree5_1Options = {
        childName: 'golAbies',
        dictionary: {
            noItem: 'No golAbi! :(',
            titlePlaceholder: 'Type ...',
            rootAddBtn: 'Add main golAbi',
            confirmBtn: 'YES',
            cancelBtn: 'NO'
        }
    }
    
    $scope.tree5_2Options = {
        childName: 'golAbies',
        direction: 'rtl',
        dictionary: {
            noItem: 'موردی وجود ندارد!',
            titlePlaceholder: 'عنوان ...',
            rootAddBtn: 'افزودن',
            confirmBtn: 'تایید',
            cancelBtn: 'انصراف'
        }
    }

}]);