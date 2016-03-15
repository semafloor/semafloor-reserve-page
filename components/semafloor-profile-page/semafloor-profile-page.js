var _rippleNames = [
  'uname', 'uid', 'group', 'email', 'role', 'room', 'floor', 'time', 'timeout'];

Polymer({

  is: 'semafloor-profile-page',

  properties: {
    profile: {
      type: Object,
      value: function() {
        return {};
        // return {
        //   username: 'John Doe',
        //   uid: 'jdxhr',
        //   group: 2,
        //   email: 'johndoe@jmail.com',
        //   role: 'normal',
        //   room: 'A002',
        //   floor: 'T001',
        //   tzone: 'GMT +8',
        //   tout: 1440
        // }
      }
    },
    uid: {
      type: String,
      // value: 'google:9999'
      // TODO: For testing purpose...
      value: 'google:103450531185198654718'
    },

    _invalidEmail: {
      type: Boolean,
      value: false
    },
    _changEmail: {
      type: String,
      value: 'johndoe@jmail.com'
    },
    _timezone: {
      type: String,
      value: 'eight'
    },
    _scrolled: {
      type: Boolean,
      value: false
    },
    _rippleToBeCancelled: {
      type: Number,
      value: -1
    },
    _changeDialog: {
      type: String,
      value: 'El Psy Kongroo'
    },
    _changeTitle: {
      type: String,
      value: 'El Psy Kongroo'
    },
    _message: {
      type: String,
      value: 'El Psy Kongroo'
    },

    _profileURL: {
      type: String,
      value: 'https://semafloor-webapp.firebaseio.com'
    },

    _isChangeDialogOpened: Boolean,
    _placeholderEmail: String,
    _isLoading: {
      type: Boolean,
      value: !0
    },

  },

  listeners: {
    'profileListContainer.touchmove': '_cancelRippleWhileScrolling'
  },

  observers: [
    '_updateProfile(uid)'
  ],

  // Element Lifecycle
  created: function() {
    // console.time('profile-page-ready');
    // console.log('profile-page-created');
  },

  ready: function() {
    // `ready` is called after all elements have been configured, but
    // propagates bottom-up. This element's children are ready, but parents
    // are not.
    //
    // This is the point where you should make modifications to the DOM (when
    // necessary), or kick off any processes the element wants to perform.
    // console.timeEnd('profile-page-ready');
    // this.fire('profile-page-ready');
  },

  attached: function() {
    // `attached` fires once the element and its parents have been inserted
    // into a document.
    //
    // This is a good place to perform any work related to your element's
    // visual state or active behavior (measuring sizes, beginning animations,
    // loading resources, etc).
    // console.timeEnd('profile-page-attached');
    this._manipulateDocumentScrolling('hidden');
    this.fire('profile-page-attached');
  },

  detached: function() {
    // The analog to `attached`, `detached` fires when the element has been
    // removed from a document.
    //
    // Use this to clean up anything you did in `attached`.
  },

  _cancelRippleWhileScrolling: function(ev) {
    if (!this._scrolled) {
      this.set('_scrolled', !0);
    }else {
      var _ripples = Polymer.dom(this.root).querySelectorAll('paper-ripple');
      _ripples[this._rippleToBeCancelled].upAction();
    }
  },
  _onDown: function(ev) {
    var _target = ev.target;

    while (_target && _target.tagName !== 'DIV') {
      _target = _target.parentElement;
    }

    if (_target && _target.hasAttribute('ripple')) {
      var _ripple = _target.getAttribute('ripple');
      this.set('_scrolled', !1);
      this.set('_rippleToBeCancelled', _rippleNames.indexOf(_ripple));
    }
  },
  _onUp: function() {
    if (this._scrolled) {
      return;
    }
  },
  _changeDetail: function(ev) {
    this.debounce('_changeDetail', function() {
      // do nothing when no tap or scrolled.
      if (this._scrolled) {
        return;
      }

      var _target = ev.target;
      while (_target && _target.tagName !== 'DIV') {
        _target = _target.parentElement;
      }

      if (_target && _target.hasAttribute('data-profile')) {
        var _detail = _target.getAttribute('data-profile');

        this.set('_changeTitle', _detail === 'email' ?
        'Change email' : 'Change time zone');
        this.set('_changeDialog', _detail);

        // Lazily load and open dialog.
        this._lazifyDialog('_isChangeDialogOpened', 'changeDialog');
      }
    }, 1);
  },

  _isEmail: function(_changeDialog) {
    return _changeDialog === 'email';
  },

  _confirmChange: function(ev) {
    // If tap on item and move away from the item, it hence is being scrolled.
    if (this._scrolled) {
      return;
    }

    var _target = ev.target;
    if (_target && _target.tagName === 'PAPER-BUTTON') {
      var _text = 'Something wrong! Please try again.';
      // hide toast for the next display.
      if (this.$.profileToast.opened) {
        this.$.profileToast.hide();
      }
      // update change accordingly.
      if (this._changeDialog === 'email') {
        // workaround: to get value of input from the input.
        var _changeEmail = this._changeEmail;
        if (_changeEmail && !this._invalidEmail) {
          _text = 'Email has been changed successfully!';
          // X - TODO: change to modify value in Firebase.
          // this.set('profile.email', _changeEmail);
          this._commitFirebase('email', _changeEmail, _text);
        }
      }else {
        if (this._timezone) {
          _text = 'Time zone has been changed successfully!';
          // X - TODO: change to modify value in Firebase.
          this._commitFirebase('tzone', this._timezone === 'eight' ? 'GMT +8' : 'GMT +9', _text);
        }
      }
    }
  },

  _updateProfile: function(_uid) {
    // when user logged in, uid will change thus Firebase references to different location.
    this.set('_profileURL', 'https://semafloor-webapp.firebaseio.com/users/google/' + _uid);
  },

  _onFirebaseValue: function(ev) {
    var _val = ev.detail.val();

    if (_.isNull(_val)) {
      return;
    }

    // Set to correct email value.
    this.set('_placeholderEmail', _val.profile.email);
    // Set to correct time zone value.
    this.set('_timezone', _val.profile.tzone === 'GMT +8' ? 'eight' : 'nine');
    // when Firebase retrieves new data, update profile.
    this.set('profile', _val.profile);

    // Reveal element.
    this.set('_isLoading', !1);
    this._manipulateDocumentScrolling();
  },
  // commit user changes to Firebase.
  _commitFirebase: function(_category, _commitValue, _successText) {
    var _that = this;
    var _ref = new Firebase(this.$.firebaseProfile.location);
    _ref.child('profile').once('value', function(snapshot) {
      _ref.child('profile/' + _category).transaction(function(data) {
        return _commitValue;
      }, function(error, committed, snapshot) {
        if (error) {
          console.error(error);
        }else if (!committed) {
          console.warn('Changes not committed!');
        }else {
          console.log('Changes committed to Firebase!');
          // Update toast message.
          _that.set('_message', _successText);
          _that.async(function() {
            _that.$.profileToast.show()
          }, 350);
        }
      });
    }, function(error) {
      console.error(error);
    });
  },

  _manipulateDocumentScrolling: function(_state) {
    var _overflow = typeof _state == 'object' ? '' : _state || '';
    document.body.style.overflow = _overflow;
  },
  // Lazily load and open dialog.
  _lazifyDialog: function(_isDialogOpened, _dialog) {
    this._manipulateDocumentScrolling('hidden');
    if (!this[_isDialogOpened]) {
      this.set(_isDialogOpened, !0);
      this.async(function() {
        this.$$('#' + _dialog).open();
      }, 1);
    }else {
      this.$$('#' + _dialog).open();
    }
  },

  _computeLoadingCls: function(_isLoading) {
    return _isLoading ? '' : 'finish-loading';
  },

  // X - TODO: Disable and restore document scrolling when dialog opens and closes.
  // X - TODO: touchmove.
  // TODO: Enter to confirm input change.
});
