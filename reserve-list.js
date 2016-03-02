Polymer({
  is: 'reserve-list',

  properties: {
    name: {
      type: String,
      value: 'forever'
    },
    count: {
      type: Number,
      value: 99,
      notify: true
    },
    uid: {
      type: String,
      // google:103450531185198654718
      value: 'google:9999'
    },

    _reservations: {
      type: Object,
      value: function() {
        return [];
      }
    },
    _selectedIdx: {
      type: Number,
      value: 0
    },
    _selectedItem: {
      type: Object,
      value: function() {
        return {};
      }
    },
    _isPhone: {
      type: Boolean,
      value: false
    },
    _isDesktop: {
      type: Boolean,
      value: false
    },
    _msg: {
      type: String,
      value: ''
    },
    _hideUndo: {
      type: Boolean,
      value: false
    },
    _location: {
      type: String,
      value: ''
    },
  },

  observers: [
    '_onQueryChanged(_isPhone, _isDesktop)',
    // '_updateFirebaseLocation(name)'
    '_updateFirebaseLocation(uid)'
  ],

  attached: function() {
    // Only at attached stage, this.updateStyles can be utilised.
    // else only Polymer.updateStyles can be used.
    // In this case, call this.updateListStyles at attached stage.
    this.updateListStyles(this._isPhone, this._isDesktop);
    this.updateList();

    var _dialog = this.$$('#optionsDialog');
    _dialog.animationConfig = {
      'entry': {
        name: 'transform-animation',
        node: _dialog,
        transformFrom: 'translateY(100%)',
        transformTo: 'translateY(0)'
      },
      'exit': {
        name: 'transform-animation',
        node: _dialog,
        transformFrom: 'translateY(0)',
        transformTo: 'translateY(100%)'
      }
    };
    // fire list-attached event.
    // this.fire('list-attached', this.name);
  },

  _onFirebaseValue: function(ev) {
    console.log(ev.detail.val());
    if (!ev.detail.val()) {
      return;
    }

    var _sortedReservations = this._sortReservations(ev.detail.val());
    // var _totalReservationsSize = ev.detail.val().totalReservations;
    // this.set('_reservations', _totalReservationsSize < 1 ? null : _sortedReservations);
    // this.set('count', _totalReservationsSize < 1 ? 0 : _.size(_sortedReservations));
    console.time('sort-all-reservations');
    this.set('_reservations', _sortedReservations);
    console.timeEnd('sort-all-reservations');
    this.set('count', _.size(_sortedReservations));

    this.fire('data-ready', this.name);
    // this.set('count', ev.detail.val().length);
    // this.set('_reservations', ev.detail.val());
    // this.fire('data-ready', this.name);
  },
  // _updateFirebaseLocation: function(_name) {
  //   this.set('_location',
  //     'https://semafloor-webapp.firebaseio.com/json/' + _name + '-booking');
  // },
  _updateFirebaseLocation: function(_uid) {
    this.set('_location',
      'https://semafloor-webapp.firebaseio.com/users/google/' + _uid + '/reservations');
  },
  _sortReservations: function(_allreservations) {
    // sort Firebase object by both 'date' and 'period' ascendingly.
    // after sorting, _allreservations will transform from type Object into type Array.
    var _sorted = _.orderBy(_allreservations, ['date', 'period'], ['asc', 'asc']);
    // var _now = new Date();
    // TODO: Testing purpose.
    var _now = new Date('2016-02-16');
    var _maxDate;
    var _maxDateString;
    var _filtered = [];
    console.log(_sorted);

    // filter _sorted reservations according to current tab page.
    if (this.name === 'today') {
      _maxDateString = [
        _now.getFullYear(),
        ('0' + (_now.getMonth() + 1)).slice(-2),
        _now.getDate()
      ].join('-');
      // return only those reservations that belong to 'today'.
      _filtered = _.filter(_sorted, { 'date': _maxDateString });
      console.log('today: ', _filtered, _.size(_filtered));
      return _filtered;
    }else if (this.name === 'thisweek') {
      var _d = _now.getDay();
      var _minDate = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - _d);
      _maxDate = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 6 - _d);
      var _minDateString = [
        _minDate.getFullYear(),
        ('0' + (_minDate.getMonth() + 1)).slice(-2),
        _minDate.getDate()
      ].join('-');
      _maxDateString = [
        _maxDate.getFullYear(),
        ('0' + (_maxDate.getMonth() + 1)).slice(-2),
        _maxDate.getDate()
      ].join('-');
      // return only those reservations that belong to 'thisweek'.
      _filtered = _.filter(_sorted, function(data) {
        return data.date >= _minDateString && data.date <= _maxDateString;
      });
      console.log('thisweek: ', _filtered, _.size(_filtered));
      return _filtered;
    }else {
      _maxDate = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + 6 - _now.getDay());
      _maxDateString = [
        _maxDate.getFullYear(),
        ('0' + (_maxDate.getMonth() + 1)).slice(-2),
        _maxDate.getDate()
      ].join('-');
      // return only those reservations that belong to 'upcoming'.
      _filtered = _.filter(_sorted, function(data) {
        return data.date > _maxDateString;
      });
      console.log('upcoming: ', _filtered, _.size(_filtered));
      return _filtered;
    }
  },

  _isExpanded: function(_idx) {
    return 'opened' + _idx;
  },

  _isCollapsible: function(_idx) {
    return 'collapse' + _idx;
  },

  _toggle: function(ev) {
    var _target = ev.target;

    if (_target.tagName === 'IRON-ICON') {
      return;
    }

    _target = _target.parentElement;

    if (_target && _target.hasAttribute('aria-controls')) {
      _target = this.$$('#' + _target.getAttribute('aria-controls'));
      var _isOpened = _target.classList.contains('opened');
      if (_target) {
        if (_isOpened) {
          _target.classList.remove('opened');
        }else {
          _target.classList.add('opened');
        }
        // update size for item after toggle.
        console.log(ev);
        this.$$('#reserveList').updateSizeForItem(ev.model.index);
        // update iron-list to fit list on screen with new height.
        this.updateList();
        this.async(function() {
        });
      }
    }
  },

  updateListStyles: function(_isPhone, _isDesktop) {
    // update number of column for collapsible item.
    var _itemWidth = _isPhone ? '50%': _isDesktop ? '25%' : '33%';
    this.updateStyles({
      '--collapsible-item-width': _itemWidth
    });
  },
  updateList: function(ev) {
    if (!_.isEmpty(this._reservations)) {
      // if dom-if has restamp, iron-list will be detached once dom-if is false.
      this.$$('#reserveList').fire('iron-resize');
    }
  },

  _onQueryChanged: function(_isPhone, _isDesktop) {
    this.updateListStyles(_isPhone, _isDesktop);
    this.updateList();
  },

  // _isObject: function(_data) {
  //   return _.isObject(_data) ? _data.tStart + ' - ' + _data.tEnd : _data;
  // },

  _optionsMenu: function(ev) {
    console.log(ev);
    var _target = ev.target;

    while (_target && _target.tagName !== 'PAPER-ICON-BUTTON') {
      _target = _target.parentElement;
    }

    this.set('_selectedIdx', ev.model.item.id);
    this.set('_selectedItem', ev.model.item);

    // this._lazifyDialog('_isOptionsOpened', 'optionsDialog');
    this.$.optionsDialog.open();
  },


  // TODO: simple removing item from list for Firebase.
  _removeItem: function(ev) {
    // close options dialog.
    this._dismissOptions();

    // access logged in user's database to read all reservations.
    var _listAjaxRef = new Firebase('https://semafloor-webapp.firebaseio.com/users/google/' +
      this.uid + '/reservations');
    var _itemToRemove = this._selectedItem;
    var _that = this;
    // if accessed user's database successfully...
    _listAjaxRef.once('value', function(snapshot) {
      var _refToRemove = '';
      snapshot.forEach(function(n) {
        // check if selected item object is equal to traversed object from Firebase.
        if (_.isEqual(n.val(), _itemToRemove)) {
          // save ref URL.
          _refToRemove = n.ref();
          // break forEach loop.
          return true;
        }
      });
      // if ref to remove an item exists...
      if (!!_refToRemove) {
        // use transaction to remove item safely.
        _refToRemove.transaction(function(data) {
          if (data === null) {
            return;
          }else {
            // return null to remove object.
            return null;
          }
        }, function(error, committed, snapshot) {
          if (error) {
            console.error(error);
          }else if (!committed) {
            console.warn('Data not found!');
          }
          // removed for better experience when removing an item.
          // else {
          //   _that._openReserveToast('The selected item has been removed.', false);
          // }
        });
        // show toast when item is removed.
        _that._openReserveToast('The selected item has been removed.', false);
      }
    });
  },

  _dismissOptions: function() {
    this.$.optionsDialog.close();
  },

  _openReserveToast: function(_msg, _hideUndo) {
    var _reserveToast = this.$.reserveToast;
    if (_reserveToast.opened) {
      _reserveToast.close();
    }
    this.toggleClass('undo-remove', _hideUndo, _reserveToast);
    this.set('_hideUndo', _hideUndo);
    this.set('_msg', _msg);
    this.async(function() {
      _reserveToast.open();
    }, 1);
  },

  // TODO: undo operation to restore removed item.
  _undoItemRemoval: function(ev) {
    var _listAjaxRef = new Firebase('https://semafloor-webapp.firebaseio.com/users/google/' +
      this.uid + '/reservations');
    var _selectedItemToRestore = this._selectedItem;
    var _that = this;
    // if accessed user's database successfully...
    _listAjaxRef.once('value', function(snapshot) {
      // restore removed item by Firebase.push method.
      _listAjaxRef.push(_selectedItemToRestore, function(error) {
        if (error) {
          console.error(error);
        }
        // removed for better experience when restoring a removed item.
        // else {
        //   _that._openReserveToast('Removed item has been restored!', true);
        // }
      });
      // show undo removal toast.
      _that._openReserveToast('Removed item has been restored!', true);
    });
  },

  // _lazifyDialog: function(_isDialogOpened, _dialog) {
  //   console.log(_isDialogOpened, _dialog);
  //   if (!this[_isDialogOpened]) {
  //     this.set(_isDialogOpened, !0);
  //     this.async(function() {
  //       console.log(this.$$('#' + _dialog), Polymer.dom(this).querySelector('paper-dialog'));
  //       var _dialog = this.$$('#' + _dialog);
  //       _dialog.animationConfig = {
  //         'entry': {
  //           name: 'transform-animation',
  //           node: _dialog,
  //           transformFrom: 'translateY(100%)',
  //           transformTo: 'translateY(0)'
  //         },
  //         'exit': {
  //           name: 'transform-animation',
  //           node: _dialog,
  //           transformFrom: 'translateY(0)',
  //           transformTo: 'translateY(100%)'
  //         }
  //       };
  //       this.async(function() {
  //         _dialog.open();
  //       }, 1);
  //     }, 1);
  //   }else {
  //     this.$$('#' + _dialog).open();
  //   }
  // },

  // Objects coerced to Array.
  _toArray: function(_detail) {
    return _.map(_.keys(_detail) , function(n) {
      return {
        name: n,
        value: _detail[n]
      };
    });
  },

  _isReservationsEmpty: function(_reservations) {
    return _.isEmpty(_reservations);
  },

  // TODO: Lazify toast.
  // TODO: Lazify dialog.
  // TODO: Lazify spinner.
  // TODO: iron-list miraculously not working anymore. Don't worry scrollTarge comes in rescue!
  // var aa = document.querySelector('semafloor-reserve-page');
  // aa.uid = 'google:103450531185198654718';
});
