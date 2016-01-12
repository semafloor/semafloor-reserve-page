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
    '_updateFirebaseLocation(name)'
  ],

  attached: function() {
    // Only at attached stage, this.updateStyles can be utilised.
    // else only Polymer.updateStyles can be used.
    // In this case, call this.updateListStyles at attached stage.
    this.updateListStyles(this._isPhone, this._isDesktop);
    this.updateList();
    // fire list-attached event.
    // this.fire('list-attached', this.name);

    var _dialog = this.$.optionsDialog;
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
  },

  _onFirebaseValue: function(ev) {
    this.set('count', ev.detail.val().length);
    this.set('_reservations', ev.detail.val());
    this.fire('data-ready', this.name);
  },
  _updateFirebaseLocation: function(_name) {
    this.set('_location',
      'https://semafloor-webapp.firebaseio.com/json/' + _name + '-booking');
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
        this.$.reserveList.updateSizeForItem(ev.model.index);
        // update iron-list to fit list on screen with new height.
        this.async(function() {
          this.updateList();
        });
      }
    }
  },

  updateListStyles: function(_isPhone, _isDesktop) {
    // update number of column for collapsible item.
    var _itemWidth = _isPhone ? '50%': _isDesktop ? '25%' : '33%';
    (this.domHost || Polymer).updateStyles({
      '--collapsible-item-width': _itemWidth
    });
  },
  updateList: function() {
    this.$.reserveList.fire('iron-resize');
  },

  _onQueryChanged: function(_isPhone, _isDesktop) {
    this.updateListStyles(_isPhone, _isDesktop);
    this.updateList();
  },

  _isObject: function(_data) {
    return _.isObject(_data) ? _data.tStart + ' - ' + _data.tEnd : _data;
  },

  _optionsMenu: function(ev) {
    var _target = ev.target;

    while (_target && _target.tagName !== 'PAPER-ICON-BUTTON') {
      _target = _target.parentElement;
    }

    this.set('_selectedIdx', ev.model.index);
    this.set('_selectedItem', ev.model.item);
    this.$.optionsDialog.open();
  },

  // TODO: simple removing item from list for Firebase.
  _removeItem: function(ev) {
    this._dismissOptions();

    // var $array = this._reservations;
    // var $idx = this._selectedIdx;
    // var $remove = _.remove($array, function(el, idx, arr) {
    //   return idx === $idx;
    // });
    // console.log($remove);
    // console.log($array);
    // console.log(this._reservations);
    this._openReserveToast('The selected item has been removed.', false);
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
    });
  },

  // TODO: undo operation to restore removed item.
  _undoItemRemoval: function() {
    this._openReserveToast('Removed item has been restored!', true);
  },

});
