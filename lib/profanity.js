/*
Copyright (C) 2014, 2017 Kano Computing Ltd.
License: http://opensource.org/licenses/MIT The MIT License (MIT)
*/

// Import languages
let en = require('./en.json');
let es = require('./es.json');

let util = require('./util');

let languages = en.concat(es);
let DEFAULT_PATTERN = listToPattern(languages);

function listToPattern(list) {
    function escapeRegexChars(word) { return word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); }
    return '(' + list.map(escapeRegexChars).join('|') + ')';
}

function getListRegex(options) {
    var pattern = DEFAULT_PATTERN;
		pattern = '\\b' + pattern + '\\b';
    return new RegExp(pattern, 'gi');
}

function check(target, options) {
    var targets = [],
        fRef,
        regex;

    options = options || {};

    if (Array.isArray(options)) {
        fRef = options;
        options = {forbiddenList: fRef};
    }

    regex = getListRegex(options);

    if (typeof target === 'string') {
        targets.push(target);
    } else if (typeof target === 'object') {
        util.eachRecursive(target, function (val) {
            if (typeof val === 'string') {
                targets.push(val);
            }
        });
    }

    var t = targets.join(' '),
        firstMatch = t.match(regex) || [],
        fullMatch,
        ssregex;

    return firstMatch
}

function matchCase(model, string) {
    var char = model[0];

    if (char === char.toUpperCase() && char !== char.toLowerCase())
        string = string.charAt(0).toUpperCase() + string.slice(1);

    return string;
}

function purifyString(str, options) {
    options = options || {};

    var matches = [],
        purified,
        regex = getListRegex(options),
        map = options.map || false,
        obscureSymbol = options.obscureSymbol || '*';

    purified = str.replace(regex, function (val) {
        matches.push(val);
        var str = val.substr(0, 1);
        for (var i = 0; i < val.length - 2; i += 1)
            str += obscureSymbol;
        return str + val.substr(-1);
    });

    return [purified, matches];
}

function purify(target, options) {
    options = options || {};

    var matches = [],
        fields = options.fields || (target instanceof Object ? Object.keys(target) : []),
        result;

    if (options.replace && options.map) {
        options.replacementMap = {};
        options.nextReplacementIndex = 0;
    }

    if (typeof target === 'string') {
        return purifyString(target, options);
    } else if (typeof target === 'object') {
        fields.forEach(function (field) {
            if (typeof target[field] === 'string') {
                result = purifyString(target[field], options);
                target[field] = result[0];
                matches = matches.concat(result[1]);
            } else if (typeof target[field] === 'object') {
                util.eachRecursive(target[field], function (val, key, root) {
                    if (options.fields && options.fields.indexOf(key) === -1)
                        return;
                    if (typeof val === 'string') {
                        result = purifyString(val, options);
                        root[key] = result[0];
                        matches = matches.concat(result[1]);
                    }
                });
            }
        });
        return [target, matches];
    }
}

module.exports = {
    check: check,
    purify: purify
};
