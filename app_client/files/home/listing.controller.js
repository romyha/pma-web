(function () {
    angular.module("pm").controller("listingCtrl", listingCtrl);


    function listingCtrl($stateParams, $rootScope, $state, $location, $scope, deviceData, store, authentication, popup) {
        var vm = this;
        var image;
        var noImgPath = "../../img/No-image-found.jpg";

        if (authentication.currentUser()) {
            var author = authentication.currentUser().name;
        }

        deviceData.locations().success(function (locations) {
            vm.locations = locations;
        });

        deviceData.devices().success(function (data) {
            vm.devices = data;
        });

        vm.toItemInfo = function (code) {
            // $location.search('code', code);
            vm.updateForm = false;
            vm.activeItem = code;
            vm.chosen = true;
            vm.devicecode = code;
            deviceData.deviceByCode(code).success(function (data) {
                vm.device = data;
                vm.newName = vm.device.name;
                vm.itemDescr = vm.device.description;
                vm.itemCode = vm.devicecode;
                vm.location = vm.device.location;
                if (!data.image) {
                    vm.path = noImgPath;
                } else {
                    vm.path = data.image;
                }
                buildStatusHistory(vm.device);
            });
        };

        if ($location.search().code) {
            vm.chosen = true;
            vm.toItemInfo($location.search().code)
            doRefresh();
        }

        vm.searchEntered = false;
        vm.order = "lastUpdate || lastModified";
        vm.reverse = true;

        vm.searchFilter = function (obj) {
            var re = new RegExp(vm.textFilter, 'i');    //ignore capitalization
            var author = '';
            if (obj.updates[0]) {
                author = obj.updates[0].author;
            }
            return !vm.textFilter || re.test(obj.name) || re.test(obj.location) || re.test(author) || re.test(obj.status) || re.test(obj.code.toString());
        }

        function doRefresh () {
            deviceData.devices().success(function (data) {
                vm.devices = data;
                if (vm.devicecode) {
                    deviceData.deviceByCode(vm.devicecode).success(function (data) {
                        vm.device = data;
                        vm.newName = vm.device.name;
                        vm.itemDescr = vm.device.description;
                        vm.itemCode = vm.devicecode;
                        vm.location = vm.device.location;
                        if (!data.image) {
                            vm.path = noImgPath;
                        } else {
                            vm.path = data.image;
                        }
                        buildStatusHistory(vm.device);
                    });
                }
            });
        };

        vm.sort = function (property) {
            if (property != vm.order) {
                vm.up = true;
            } else {
                if (vm.up) vm.up = false;
                else vm.up = true;
            }
            if (property == "name") {
                setOrders(true, false, false, false);
            } else if (property == "lastUpdate") {
                setOrders(false, true, false, false);
            } else if (property == "status") {
                setOrders(false, false, false, true);
            } else {
                setOrders(false, false, true, false);
            }
            vm.order = property;
            if (!vm.up) {
                vm.reverse = true;
            } else {
                vm.reverse = false;
            }
        }

        function setOrders(name, date, loc, stat) {
            vm.nameOrder = name;
            vm.dateOrder = date;
            vm.stateOrder = stat;
            vm.locOrder = loc;
        };

        vm.onSearch = function () {
            vm.focus = false;
            if (vm.textFilter) {
                vm.searchEntered = true;
            } else {
                vm.searchEntered = false;
                resetOrder();
            }

        };

        vm.clearSearch = function () {
            vm.textFilter = "";
            vm.searchEntered = false;
            vm.focus = true;
            resetOrder();
        };

        function resetOrder() {
            vm.order = "-lastUpdate || -date";
            vm.dateOrder = false;
            vm.nameOrder = false;
            vm.stateOrder = false;
            vm.locOrder = false;
        };

        

        vm.onActive = function (value) {
            if (value == 'out') {
                vm.activeItem = 0;
                $scope.$apply();
                vm.chosen = false;
            }
        };

        function buildStatusHistory(data) {
            var states = [];
            var count = 0, i = 0;
            while (count < 6 && i < data.updates.length) {
                if (data.updates[i] && data.updates[i].status) {
                    var color = getShadowColor(data.updates[i].status);
                    states.push(color);
                    count++;
                }
                i++;
            }
            if (states.length < 6 && vm.device.initialStatus) {
                states.push(getShadowColor(vm.device.initialStatus));
            }
            var shadow = "";
            if (states.length == 2) {
                shadow = "-5px 0 0 " + states[1];
            } else if (states.length == 3) {
                shadow = "-5px 0 0 " + states[1] + ", -10px 0 0 " + states[2];
            } else if (states.length == 4) {
                shadow = "-5px 0 0 " + states[1] + ", -10px 0 0 " + states[2] + ", -15px 0 0 " + states[3];
            } else if (states.length == 5) {
                shadow = "-5px 0 0 " + states[1] + ", -10px 0 0 " + states[2] + ", -15px 0 0 " + states[3] + ", -20px 0 0 " + states[4];
            } else {
                shadow = "-5px 0 0 " + states[1] + ", -10px 0 0 " + states[2] + ", -15px 0 0 " + states[3] + ", -20px 0 0 " + states[4] + ", -25px 0 0 " + states[5];
            }
            var marg = (states.length - 1) * 5;
            vm.style = {
                "box-shadow": shadow,
                "margin-left": marg + "px"
            };
        };

        function getShadowColor(status) {
            switch (status) {
                case "green": {
                    return "rgb(124,252,150)";
                }
                case "yellow": {
                    return "rgb(255,230,0)";
                }
                case "blue": {
                    return "rgb(170,200,255)";
                }
                case "red": {
                    return "rgb(255,110,90)";
                }
            }
        };

        vm.deleteUpdate = function (updateid) {
            var confirmed = window.confirm('Are you sure to delete this update?');
            if (confirmed) {
                deviceData.deleteUpdate(vm.device._id, updateid).success(function () {
                    doRefresh();
                }).error(function (err) {
                    if (typeof err == 'string' && err.indexOf('Unauthorized') > -1)
                    { alert('You do not have permission to do this.'); }
                });
            }
        };

        vm.editDevice = function () {
            vm.editing = true;
        };

        vm.saveDevice = function () {
            var device = {
                name: vm.newName,
                description: vm.itemDescr,
                code: vm.itemCode
            };

            if (image) {
                deviceData.upload(vm.devicecode, image).success(function (data) {
                    console.log(data);
                }).error(function (err) {
                    console.log(err);
                });
            }
            deviceData.editDeviceById(vm.device._id, device).success(function (device) {
                vm.editing = false;
                if (vm.location != vm.device.location) {
                    deviceData.addUpdateById(vm.device._id, {
                        author: author,
                        location: vm.location,
                        date: new Date()
                    });
                }
                if (!(vm.locations.indexOf(vm.location) > -1)) {
                    deviceData.addLocation({
                        name: vm.location
                    });
                }
                doRefresh();
                vm.toItemInfo(vm.itemCode);
            }).error(function (err) {
                if (err.errmsg) {
                    if (err.errmsg.indexOf('$name') > -1 && err.errmsg.indexOf('dup key') > -1)
                    { vm.nameerror = "This name already exists."; }
                    if (err.errmsg.indexOf('$code') > -1 && err.errmsg.indexOf('dup key') > -1)
                    { vm.codeerror = "This code already exists."; }
                } else if (typeof err == 'string' && err.indexOf('Unauthorized') > -1)
                { alert('You do not have permission to do this.'); }
            });
        };

        setImgFile = function () {
            vm.path = URL.createObjectURL(event.target.files[0]);

            var chooser = document.getElementById('file-chooser');
            var file = chooser.files[0];
            if (file) {
                image = file;
                vm.uploaded = true;
            }
            $scope.$apply();
        };

        vm.removeImg = function () {
            vm.path = '../../img/No-image-found.jpg';
            vm.uploaded = false;
        };

        vm.toEdit = function (update) {
            vm.updEdit = true;
            vm.color = update.status;
            //Copy update to edUpdate
            vm.edUpdate = Object.assign({}, update);
        };

        vm.openPopup = function (id) {
            if (vm.edUpdate) {
                vm.opened = vm.edUpdate._id == id
            }
        }

        vm.canEdit = function (author) {
            if ($rootScope.testMode) return false;
            if ((authentication.currentUser() && authentication.currentUser().name == author) || author == "test user" || (store.get('profile') && author == store.get('profile').email)) {
                return true;
            } else return false;
        };

        vm.setStatus = function (color, status) {
            vm.status = status;
            vm.color = color;
        };

        vm.addUpdate = function () {
            deviceData.addUpdateById(vm.device._id, {
                author: author,
                location: vm.update.location,
                date: new Date(),
                status: vm.color,
                message: vm.update.message
            }).success(function (data) {
                doRefresh();
                vm.toItemInfo(vm.devicecode);
            });
        };

        vm.scan = function () {
            alert('Not yet scanning from browser.');
        };
    }
})();