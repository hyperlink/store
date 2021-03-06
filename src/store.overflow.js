/**
 * Copyright (c) 2013 ESHA Research
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * When quota is reached on a storage area, this shifts incoming values to 
 * fake storage, so they last only as long as the page does. This is useful
 * because it is more burdensome for localStorage to recover from quota errors
 * than incomplete caches. In other words, it is wiser to rely on store.js
 * never complaining than never missing data. You should already be checking
 * the integrity of cached data on every page load. Also note that quota errors
 * are thrown by Safari for *every* setItem when user is in private browsing mode.
 * http://spin.atomicobject.com/2013/01/23/ios-private-browsing-localstorage/
 *
 * Status: BETA
 */
;(function(store, _) {
    var _set = _.set,
        _get = _.get,
        _remove = _.remove,
        _key = _.key,
        _length = _.length,
        _clear = _.clear;

    _.overflow = function(area, create) {
        var name = area === _.areas.local ? '+local+' :
                   area === _.areas.session ? '+session+' : false;
        if (name) {
            var overflow = _.areas[name];
            if (create && !overflow) {
                overflow = store.area(name)._area;// area() copies to _.areas
            } else if (create === false) {
                delete _.areas[name];
                delete store[name];
            }
            return overflow;
        }
    };
    _.set = function(area, key, string) {
        try {
            _set.apply(this, arguments);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                return _.set(_.overflow(area, true), key, string);
            }
            throw e;
        }
    };
    _.get = function(area, key) {
        var overflow = _.overflow(area);
        return (overflow && _get.call(this, overflow, key)) ||
            _get.apply(this, arguments);
    };
    _.remove = function(area, key) {
        var overflow = _.overflow(area);
        if (overflow){ _remove.call(this, overflow, key); }
        _remove.apply(this, arguments);
    };
    _.key = function(area, i) {
        var overflow = _.overflow(area);
        if (overflow) {
            var l = _length.call(this, area);
            if (i > l) {
                i = i - l;// make i overflow-relative
                for (var j=0, m=_length.call(this, overflow); j<m; j++) {
                    if (j === i) {// j is overflow index
                        return _key.call(this, overflow, j);
                    }
                }
            }
        }
        return _key.apply(this, arguments);
    };
    _.length = function(area) {
        var length = _length(area),
            overflow = _.overflow(area);
        return overflow ? length + _length(overflow) : length;
    };
    _.clear = function(area) {
        _.overflow(area, false);
        _clear.apply(this, arguments);
    };

})(window.store, window.store._);