var _alphaFloors = [
  'level 1','level 2','level 3','level 3A','level 5','level 6',
  'level 7','level 8','level 9','level 10','level 11','level 12'];
var _alphaFloorsCode = [
  '01level','02level','03level','04level','05level','06level',
  '07level','08level','09level','10level','11level','12level'];
var _siteNames = ['KLB - Tower 5','KLB - Tower 2A','SUITE'];

Polymer({

  is: 'semafloor-current-page',

  properties: {
    selectedSite: {
      type: String,
      value: 'KLB - Tower 5'
    },
    selectedFloor: {
      type: String,
      value: '13level'
    },
    selectedFloorName: {
      type: String,
      value: 'Level 13'
    },
    selectedRoomName: {
      type: String,
      value: 'El Psy Kongroo'
    },

    _selectedPage: String,
    _floorsAtSelectedSite: {
      type: Array,
      value: function() {
        return _alphaFloors;
      },
      computed: '_computeFloorsAtSelection(selectedSite)'
    },

    _currentReservations: Array,
    _allSitesData: Object,

    _url: {
      type: String,
      // value: 'https://semafloor-webapp.firebaseio.com/json/current-reservations'
      value: function() {
        function _getWeek(_fulldate) {
          var _now = new Date(_fulldate.getFullYear(), _fulldate.getMonth(), _fulldate.getDate() - _fulldate.getDay() + 4);
          var _onejan = new Date(_now.getFullYear(), 0, 1);

          return Math.ceil(((_now - _onejan) / 86400000 + 1) / 7);
        }

        function _getMonthName(_month) {
          var _monthName = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];

          return _monthName[_month];
        }

        var _today = new Date();
        var _baseRef = 'https://polymer-semaphore.firebaseio.com/mockMessages';
        var _year = _today.getFullYear();
        var _month = _.padStart(_today.getMonth(), 2, '0') + _getMonthName(_today.getMonth());
        var _week = 'week' + _.padStart(_getWeek(_today), 2, '0');
        var _date = _.padStart(_today.getDate(), 2, '0');

        return [_baseRef, _year, _month, _week, _date].join('/');
        // TODO: For development purpose...
        // return [_baseRef, _year, _month, 'week07', 17].join('/');
      }
    },
    _floorStatus: Object,

    _roomsAtSelectedFloor: {
      type: Array,
      value: function() {
        return [];
      },
      computed: '_computeRoomsAtSelection(selectedSite, selectedFloor, _allSitesData)'
    },
    _infoAtSelectedRoom: {
      type: Array,
      value: function() {
        return [];
      }
    },

    _reservationDetails: Object,
    _detailAtSelectedRoom: Array,

    _dialogAnimationDone: {
      type: Boolean,
      value: !0
    },
    _dialogTitle: String,
    _dialogList: Array,
    _isDialogInfo: Boolean,

    _isWeekend: Boolean,
    _veryLargeDesktop: Boolean,
    _newBackgroundImage: String,
    _isLoading: Boolean,

    _isWeekendPageOpened: Boolean,
    _isRoomPageOpened: Boolean,
    _isInfoPageOpened: Boolean,
    _isInfoOrScheduleOpened: Boolean,
    _isSpinnerOpened: Boolean,

  },

  observers: [
    '_whenSelectedSiteChanged(selectedSite)',
    '_computeFloorStatus(_currentReservations, selectedSite)',
    '_openDialog(_dialogAnimationDone)',
    '_isMobilePortraitChanged(_isMobilePortrait)',
    '_transitionSpinner(_isLoading)'
  ],

  // Element Lifecycle
  created: function() {
  },

  ready: function() {
    // `ready` is called after all elements have been configured, but
    // propagates bottom-up. This element's children are ready, but parents
    // are not.
    //
    // This is the point where you should make modifications to the DOM (when
    // necessary), or kick off any processes the element wants to perform.
    // console.timeEnd('semafloor-current-ready');
  },

  attached: function() {
    // `attached` fires once the element and its parents have been inserted
    // into a document.
    //
    // This is a good place to perform any work related to your element's
    // visual state or active behavior (measuring sizes, beginning animations,
    // loading resources, etc).
    var _clientWidth = this.clientWidth;
    if (_clientWidth > 800) {

      // TODO: If screen larger than 1200, allows 2 dialogs to show on screen at the same time.
      // if (_clientWidth >= 1200) {
      //   this.$.infoOrSchedule.noCancelOnOutsideClick = !0;
      // }
      this.set('_veryLargeDesktop', !0);
      this._changeNewBackgroundImage();
    }

    // TODO: load external resources, eg. Firebase.
    this.fire('current-page-attached');
    // console.timeEnd('semafloor-current-attached');
  },

  detached: function() {
    // The analog to `attached`, `detached` fires when the element has been
    // removed from a document.
    //
    // Use this to clean up anything you did in `attached`.
  },

  _onFirebaseValue: function(ev) {
    console.log('firebase value: ', ev.detail.val());
    var _firebaseData = ev.detail.val();

    // Probably today is weekend, yet you're checking for reservations.
    if (_.isEmpty(_firebaseData.site)) {
      this.set('_isWeekend', !0);
      // Observer won't work if one of the dependencies is undefined.
      this.set('_allSitesData', {});
      this.set('_currentReservations', []);

      if (this._isLoading) {
        this.set('_isLoading', !1);
        this._lazifySelectedPage('_isWeekendPageOpened', 'weekend');
      }
      return;
    }

    // hide spinner and switch to room page.
    if (this.selectedFloor !== '13level' && this._isLoading) {
      this.set('_isLoading', !1);

      this._lazifySelectedPage('_isRoomPageOpened', 'room');
    }

    // fire an event when data is fetched.
    this.fire('current-reservations-ready');

    // TODO: What if today happens to be one of the weekends?
    // Set _allSitesData first before _currentReservations.
    this.set('_allSitesData', _firebaseData.site);
    this.set('_currentReservations', _.sortBy(_.pickBy(_firebaseData.reservations, function(_value, _key) { return _key.length > 4; }), ['fromTime']));

    console.log('on-firebase-value');
  },

  _computeFloorsAtSelection: function(_selectedSite) {
    var _idx = _siteNames.indexOf(_selectedSite);
    var _floors = [_alphaFloors, ['level 3'], ['level 1']][_idx];
    return _floors;
  },
  _whenSelectedSiteChanged: function(_selectedSite) {
    // Now change to new background image on each site value changes.
    this._changeNewBackgroundImage();
    // go back to floor page when select on another site at floor page.
    if (this._selectedPage !== 'floor') {
      this._lazifySelectedPage('_isFloorPageOpened', 'floor');
    }
  },
  _computeFloorStatus: function(_currentReservations, _selectedSite) {
    // X - TODO: Major change as global reservations list now has total different structure.
    if (_.isUndefined(_currentReservations) || _.isEmpty(_currentReservations) || _.isUndefined(_selectedSite)) {
      // this.set('_floorStatus', {});
      // this.set('_reservationDetails', {});
      return;
    }

    var _floorsToBeInspected = _alphaFloorsCode;
    var _siteIdx = _siteNames.indexOf(_selectedSite);
    var _siteCode = ['alpha', 'beta', 'gamma'][_siteIdx];

    var _now = new Date();
    var _nowHours = _now.getHours();
    var _nowMinutes = _now.getMinutes();
    var _nowInMinutes = _nowHours * 60 + _nowMinutes;
    var _isDivisibleByHalfHour = _nowInMinutes % 30 === 0;

    var _backwardTimeInHours = _isDivisibleByHalfHour ? _nowInMinutes / 30 - 1 : Math.floor(_nowInMinutes / 30);
    var _forwardTimeInHours = _isDivisibleByHalfHour ? _nowInMinutes / 30 : Math.ceil(_nowInMinutes / 30);

    var _backwardTimeString = _.padStart(Math.floor(_backwardTimeInHours / 2), 2, '0') + ':' + _.padStart(_backwardTimeInHours / 2 % 1 * 60, 2, '0');
    var _forwardTimeString = _.padStart(Math.floor(_forwardTimeInHours / 2), 2, '0') + ':' + _.padStart(_forwardTimeInHours / 2 % 1 * 60, 2, '0');

    var _extractedReservationsTemp = {};
    var _reservationDetailsTemp = {};
    _.forEach(_currentReservations, function(n) {
      if (n.roomInfo.site === _selectedSite) {
        if (n.fromTime >= _backwardTimeString && n.fromTime <= _forwardTimeString) {
          // X - TODO: To filter reservations at current time period.
          var _lowerFirstLevel = _.lowerFirst(n.roomInfo.floor);
          var _convertedFloorIdx = _alphaFloors.indexOf(_lowerFirstLevel);
          var _convertedFloorCode = _alphaFloorsCode[_convertedFloorIdx];
          if (_.isUndefined(_extractedReservationsTemp[_lowerFirstLevel])) {
            _extractedReservationsTemp[_lowerFirstLevel] = [];
            _reservationDetailsTemp[_lowerFirstLevel] = {};
          }
          _extractedReservationsTemp[_lowerFirstLevel].push(n.roomInfo.room);
          _reservationDetailsTemp[_lowerFirstLevel][n.roomInfo.room] = n;
        }

      }
    });

    _.forIn(_extractedReservationsTemp, function(n, _key) {
      _extractedReservationsTemp[_key] = _.uniq(n);
    });

    this.set('_floorStatus', _extractedReservationsTemp);
    this.set('_reservationDetails', _reservationDetailsTemp);
  },
  _isVacantFloor: function(_currentReservations, _selectedSite, _item) {
    // TODO: To test if all rooms at one floor are reserved at the same time, the status should turn red from green.
    if (_.isEmpty(_currentReservations) || _.isUndefined(_currentReservations)) {
      return '';
    }

    var _allSitesData = this._allSitesData;
    var _isVacantFloor = !0;
    var _allFloors = [];

    if (_selectedSite === 'KLB - Tower 2A') {
      if (_item === 'level 3') {
        _allFloors = _.keys(_allSitesData['beta']['03level']);
        _isVacantFloor = _.isEqual(_allFloors, _currentReservations['03level']);
        return _isVacantFloor ? ' fully-occupied' : '';
      }

      return '';
    }else if (_selectedSite === 'SUITE') {
      if (_item === 'level 1') {
        _allFloors = _.keys(_allSitesData['gamma']['01level']);
        _isVacantFloor = _.isEqual(_allFloors, _currentReservations['01level']);
        return _isVacantFloor ? ' fully-occupied' : '';
      }

      return '';
    }else {
      var _floorIdx = _alphaFloors.indexOf(_item);
      var _floorCode = _alphaFloorsCode[_floorIdx];
      _allFloors = _.keys(_allSitesData['alpha'][_floorCode]);
      _isVacantFloor = _.isEqual(_allFloors, _currentReservations[_item]);
      return _isVacantFloor ? ' fully-occupied' : '';
    }
  },
  _unveilFloor: function(ev) {
    // Nothing to show on weekends.
    if (this._isWeekend) {
      this._lazifySelectedPage('_isWeekendPageOpened', 'weekend');
      return;
    }

    // X - TODO: Minor change as global reservations list now has total different structure.
    var _target = ev.target;

    if (_target && _target.hasAttribute('floor')) {
      var _floor = ev.model.item;
      var _selectedSite = ev.model.selectedSite;

      if (_.isEmpty(this._allSitesData) || _.isUndefined(this._allSitesData)) {
        this.set('_isLoading', !0);
      }else {
        this._lazifySelectedPage('_isRoomPageOpened', 'room');
      }

      this.set('selectedFloor', _floor === 'level 3A' ? '04level' : _alphaFloorsCode[_alphaFloors.indexOf(_floor)]);
      this.set('selectedFloorName', _floor);
    }
  },
  _backSite: function() {
    this.set('selectedFloor', null);
    this.set('selectedFloorName', null);

    this._lazifySelectedPage('_isFloorPageOpened', 'floor');
  },

  _computeRoomsAtSelection: function(_selectedSite, _selectedFloor, _site) {
    // X - TODO: Major change as global reservations list now has total different structure.
    if (_.isUndefined(_site) || _.isEmpty(_site)) {
      return [];
    }

    var _decodedSite = ['alpha', 'beta', 'gamma'][_siteNames.indexOf(_selectedSite)];
    var _floorData = this._allSitesData[_decodedSite][_selectedFloor];
    var _rooms = _.keys(_floorData);

    return _rooms;
  },
  _unveilRoom: function(ev) {
    var _target = ev.target;

    if (_target && _target.hasAttribute('room')) {
      // X - TODO: Only show info of reservations at current time period.
      var _selectedSite = this.selectedSite;
      var _selectedFloor = this.selectedFloor;
      var _selectedItem = ev.model.item
      var _decodedSite = ['alpha', 'beta', 'gamma'][_siteNames.indexOf(_selectedSite)];
      var _decodedFloor = _alphaFloors[_alphaFloorsCode.indexOf(_selectedFloor)];
      var _temp = this._allSitesData[_decodedSite][_selectedFloor][_selectedItem];

      var _detailAtSelectedRoom = _.isUndefined(this._reservationDetails) || _.isUndefined(this._reservationDetails[_decodedFloor]) ? '' : this._reservationDetails[_decodedFloor][_selectedItem];
      _temp['name'] = _selectedItem;

      this._lazifySelectedPage('_isInfoPageOpened', 'info');

      this.set('_detailAtSelectedRoom', [_detailAtSelectedRoom]);
      this.set('selectedRoomName', _selectedItem);
      this.set('_infoAtSelectedRoom', [_temp]);
    }
  },
  _backRoom: function() {
    this.set('selectedRoomName', null);
    // this.set('_selectedPage', 'room');
    this._lazifySelectedPage('_isRoomPageOpened', 'room');
  },
  _isVacantRoom: function(_item) {
    // X - TODO: Minor change due to different structure of global reservations list.
    // ? - TODO: It's quite hard to be of status RESERVED in this system.
    if (_.isUndefined(_item) || _.isEmpty(_item) || _.isUndefined(this._floorStatus)) {
      return '';
    }

    var _ff;
    var _fs = this._floorStatus;
    var _isVacantRoom = !0;

    if (_.isObject(_item)) {
      _ff = _.lowerFirst(_item.floor);
      if (!_.isUndefined(_fs[_ff])) {
        _isVacantRoom = _fs[_ff].indexOf(_item.name) < 0;
      }
    }else {
      _ff = _alphaFloors[_alphaFloorsCode.indexOf(this.selectedFloor)];
      if (!_.isUndefined(_fs[_ff])) {
        _isVacantRoom = _fs[_ff].indexOf(_item) < 0;
      }
    }

    var _cls = _isVacantRoom ? '' : ' fully-occupied';

    return _cls;
  },
  _isRoomLocked: function(_locked) {
    if (_.isUndefined(_locked)) {
      return '-open';
    }

    return JSON.parse(_locked) ? '-open' : '';
  },
  _isRoomLockedMsg: function(_locked) {
    if (_.isUndefined(_locked)) {
      return 'This room is open to the public.';
    }

    return _locked ? 'This room is open to the public.' : 'This room has restricted access to the public.';
  },
  _isRoomOccupied: function(_item) {
    // X - TODO: Minor change due to different strucutre in global reservations list.
    _ff = _.lowerFirst(_item.floor);
    var _fs = this._floorStatus;
    var _isVacantRoom = !0;

    if (!_.isUndefined(_fs) && !_.isUndefined(_fs[_ff])) {
      _isVacantRoom = _fs[_ff].indexOf(_item.name) < 0;
    }

    return _isVacantRoom ? 'unchecked' : 'checked';
  },

  // workaround for importHref.
  // Nothing shows when switch to other page while the page is loading even it's loaded.
  updateCurrentPages: function() {
    this.$.currentPages.notifyResize();
  },

  // TODO: Able to show all reservations of a room and room info.
  _showInfoOrSchedule: function(ev) {
    var _target = ev.target;

    // noop if dialog's still animating.
    if (!this._dialogAnimationDone) {
      return;
    }

    // Only when is dialog's animation done, prepare to open new dialog.
    if (_target && _target.tagName === 'IRON-ICON') {
      if (_target.hasAttribute('icon')) {
        var _icon = _target.getAttribute('icon');
        var _dialogTitle = 'Room Schedule';
        var _dialogList = this._infoAtSelectedRoom;
        var _isDialogInfo = !1;

        if (_icon.indexOf('info') > 0) {
          _dialogTitle = 'Room Information';
          _isDialogInfo = !0;
        }else {
          var _hexTypes = _.padStart(parseInt(_dialogList[0].time, 16).toString(2), 32, 0);
          var _str2arr = _hexTypes.split('').map(Number);

          for (var i = 8, j = 0, k = 0, l =0, _timeArray = []; i < 24; j = j + 30, l++) {
            if (j === 60) {
              j = 0;
              i++;
            }

            if (i < 24) {
              k = _.padStart(i, 2, '0') + ':' + _.padStart(j, 2, '0');
              _timeArray.push({
                fulltime: k,
                result: _str2arr[l]
              });
            }
          }
          _dialogList = _timeArray;
        }

        // Setting up dialog.
        this.set('_isDialogInfo', _isDialogInfo);
        this.set('_dialogTitle', _dialogTitle);
        this.set('_dialogList', _dialogList);

        // Set !1 to _dialogAnimationDone which will trigger _openDialog method.
        this.set('_dialogAnimationDone', !1);
        // this.$.infoOrSchedule.open();
      }
    }
  },

  // TODO: Even though neon-animation-finish fires off, the iron-overlay-closed is not yet fired.
  // In this case, when animation is done and the dialog is still opened, the subsequent dialog
  // will distort in its appearance during animation and/ or affect its resizing during/ after
  // animation.
  // In order to tackle this issue, the dialog must be closed after animation is done.
  // MUST always ensure that both neon-animation-finish and iron-overlay-closed are fired!
  // To make things simple, listen for iron-overlay-closed is more than enough.
  // HOWEVER, delay is certainly there for all of these to happen during user interaction.
  _dialogClosedDone: function(ev) {
    if (!this._dialogAnimationDone) {
      console.warn('Subsequent dialog is now ready to be opened!');
      // Bring back document scrolling.
      this._manipulateDocumentScrolling();
      this.set('_dialogAnimationDone', !0);
    }
  },

  _openDialog: function(_dialogAnimationDone) {
    // Only when is _dialogAnimationDone falsy dialog is allowed to be opened.
    if (!_dialogAnimationDone) {
      // Disable document scrolling.
      this._manipulateDocumentScrolling('hidden');

      this._lazifyDialog('_isInfoOrScheduleOpened', function() {
        var _dialog = this.$$('#infoOrSchedule');
        _dialog.notifyResize();
        this.async(function() {
          _dialog.open();
        }, 1);
      });
    }
  },

  _isRestricted: function(_access) {
    // TODO: Since Firebase data has not been updated, no it's undefined.
    return _access ? 'No' : 'Yes';
  },
  _decodeTypes: function(_types) {
    var _roomTypes = [
      'Adjoining Room (Operable Wall)','Panaboard','Polycom CX100 (Audio)',
      'Polycom CX5000 (Video Conferencing)','Projector','Projector Cable Faulty',
      'Projector Faulty','Screen Projector Faulty','SmartBoard 800','Telepresence',
      'TV','Writing Glass Board'];
    var _hexTypes = _.padStart(parseInt(_types, 16).toString(2), 12, 0);
    var _str2arr = _hexTypes.split('').map(Number);
    var _filtered = [];
    _.forEach(_str2arr, function(el, idx) {
      if (el === 1) _filtered.push(_roomTypes[idx]);
    });
    _hexTypes = null; _str2arr = null;
    return _filtered;
  },

  _isVacantTime: function(_result) {
    return !_result ? '' : ' fully-occupied';
  },

  // Change new background image for the page.
  _changeNewBackgroundImage: function() {
    var _backgroundImages = [
      'https://wallpaperscraft.com/image/mountain_building_hill_cliff_100487_2560x1440.jpg',
      'https://wallpaperscraft.com/image/trees_sunset_sky_river_winter_92676_2560x1440.jpg',
      'https://wallpaperscraft.com/image/mountains_grass_tops_sky_92475_2560x1440.jpg',
      'https://wallpaperscraft.com/image/nature_mountains_sky_lake_clouds_81150_2560x1440.jpg',
      'https://wallpaperscraft.com/image/mountains_sky_sunset_peaks_97149_2560x1440.jpg',
      'https://wallpaperscraft.com/image/full_moon_stars_clouds_shadows_45767_2560x1440.jpg',
      'https://wallpaperscraft.com/image/stars_sky_shore_84534_2560x1440.jpg',
      'https://wallpaperscraft.com/image/mountains_sea_ocean_clouds_night_96938_2560x1440.jpg',
      'https://wallpaperscraft.com/image/night_stars_alps_87097_2560x1440.jpg',
      'https://wallpaperscraft.com/image/dusk_evening_lights_home_castle_mountains_alps_christmas_slovenia_59568_2560x1440.jpg',
      'https://wallpaperscraft.com/image/switzerland_city_evening_alps_mountains_fog_95963_2560x1440.jpg',
      'https://wallpaperscraft.com/image/sunset_sea_wave_87145_2560x1440.jpg',
      'https://wallpaperscraft.com/image/hamburg_germany_speicherstadt_warehouse_evening_building_63117_2560x1440.jpg',
      'https://wallpaperscraft.com/image/decline_sea_coast_beach_mountains_sun_evening_clouds_calm_14556_2560x1440.jpg',
      'https://wallpaperscraft.com/image/mountains_houses_snow_winter_beautiful_92511_2560x1440.jpg',
      'https://wallpaperscraft.com/image/coast_sea_decline_branch_palm_tree_sand_beach_panorama_evening_orange_46137_2560x1440.jpg'
    ];
    var _backgroundImagesLen = _backgroundImages.length;
    var _randomIdx = Math.ceil(Math.random() * _backgroundImagesLen) - 1;
    this._newBackgroundImage = _backgroundImages[_randomIdx];
  },

  _transitionSpinner: function(_isLoading) {
    var _isOpaque = _isLoading ? 1 : 0;
    // Lazily load and show spinner.
    var _loadSpinner = function() {
      // Transition opacity of paper-spinnner corresponding to _isLoading's state.
      this.$$('#loadingSpinner').style.opacity = _isOpaque;
      // Hide iron-pages when spinner is showing and vice versa.
      this.$.currentPages.style.opacity = +!_isOpaque;
    };
    var _thisLoadSpinner = _loadSpinner.bind(this);

    if (!this._isSpinnerOpened) {
      this.set('_isSpinnerOpened', !0);
      this.async(_thisLoadSpinner, 1);
    }else {
      _thisLoadSpinner();
    }
  },

  // Lazily load and open the selected page.
  _lazifySelectedPage: function(_isWhichPageOpened, _page) {
    if (!this[_isWhichPageOpened]) {
      this.set(_isWhichPageOpened, !0);
      // Is this necessary? JIC loading is still running.
      this.async(function() {
        // Scroll to the top.
        if (document.body.scrollTop > 0) {
          window.scrollTo(0, 0);
        }
        this.set('_selectedPage', _page);
      }, 1);
    }else {
      // Scroll to the top.
      if (document.body.scrollTop > 0) {
        window.scrollTo(0, 0);
      }
      this.set('_selectedPage', _page);
    }
  },
  // Lazily load and open dialog.
  _lazifyDialog: function(_isWhichDialogOpened, _cb) {
    var _thisCb = _cb.bind(this);
    if (!this[_isWhichDialogOpened]) {
      this.set(_isWhichDialogOpened, !0);
      this.async(function() {
        _thisCb();
      }, 1);
    }else {
      _thisCb();
    }
  },

  _manipulateDocumentScrolling: function(_state) {
    var _overflow = typeof _state == 'object' ? '' : _state || '';

    document.body.style.overflow = _overflow;
  },

  // TODO: Add social:mood to weekend page.
  // X - TODO: _manipulateDocumentScrolling FTW.
  // X - TODO: Styling in between 360P mobile and 800P desktop.
  // X - TODO: Lazify non-critical elements.
  // X - TODO: New weekend page needs more styling.
  // X - TODO: Spinner needs more styling...
  // X - TODO: Overflow content of div.floor, div.room, div.info.
  // X - TODO: Remove _currentReservations dependcy from _computeFloorsAtSelection as this is not needed.
});
