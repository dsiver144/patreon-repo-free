//=======================================================================
// * Plugin Name  : DSI-Essential.js
// * Last Updated : 3/7/2023
//========================================================================
/*:
 * @author dsiver144
 * @plugindesc (v1.8) Essentials for DSI plugins.
 * @help 
 * ===================================================
 * > Change Log:
 * ===================================================
 * 1.0: - Finish basic functions.
 * 1.0: - Rework Save feature.
 * 1.2: - Rework Tween Function.
 * 1.3: - Add checkForNewVersion feature.
 * 1.4: - Add ESL.Bitmap.drawCircle()
 * 1.5: - Add new array util functions.
 * 1.6: - Add ESL.DateTime.convertFrameToRealLifeFormat
 *      - Add ESL.Window.drawText
 * 1.7: - Add ESL.Array.dynamicSort
 *      - Add ESL.Array.dynamicSortEx
 * 1.8: - Add ESL.Math.random
 *      - Add ESL.Math.randomInt
 *      - Add ESL.Math.clamp
 *      - Add ESL.Math.remap
 * 
 * @param checkNewVersion:boolean
 * @text Check New Version
 * @desc This will check for new version when booting the game.
 * @default true
 * @type boolean
 * 
 */
var Imported = Imported || {};
Imported["DSI-Essenstial"] = 1.8;

function ESL() {
    return new Error("This is a static class");
}

// Parse Plugin Parameters
if (!PluginManager.processParameters) {
    PluginManager.processParameters = function(paramObject) {
        paramObject = JsonEx.makeDeepCopy(paramObject);
        for (k in paramObject) {
            if (k.match(/(.+):(\w+)/i)) {
                var value = paramObject[k];
                delete paramObject[k];
                const paramName = RegExp.$1;
                const paramType = RegExp.$2;
                switch(paramType) {
                    case 'struct':
                        value = JSON.parse(value);
                        value = PluginManager.processParameters(value);
                        break;
                    case 'arr_struct':
                        var array = JSON.parse(value);
                        value = [];
                        for (let i = 0; i < array.length; i++) {
                            var rawStruct = JSON.parse(array[i]);
                            rawStruct = PluginManager.processParameters(rawStruct);
                            value.push(rawStruct)
                        }
                        break;
                    case 'num': case 'number':
                        value = Number(value);
                        break;
                    case 'arr': case 'note': case 'array':
                        value = JSON.parse(value);
                        break;
                    case 'arr_num':
                        value = JSON.parse(value).map(n => Number(n));
                        break;
                    case 'bool': case 'boolean':
                        value = value === 'true';
                        break;
                    case 'vec': case 'vector':
                        value = value.split(",").map(n => Number(n));
                        break;
                    case 'vec_str':
                        value = value.split(",");
                        break;
                }
                paramObject[paramName] = value;
            }
        }
        return paramObject;
    };
}

var ESLParams = PluginManager.parameters('DSI-Essential');
ESLParams = PluginManager.processParameters(ESLParams);
ESL.Params = ESLParams;

ESL.checkNewVersion = function () {
    if (!ESL.Params.checkNewVersion) {
        return;
    }
    const url = "https://raw.githubusercontent.com/dsiver144/PeacefulDaysMZ/master/js/plugins/DSI-Essential.js";
    fetch(url).then((res) => {
        res.text().then(str => {
            const version = +str.match(/Imported\[\"DSI-Essenstial\"\] = (.+?);/i)[1];
            if (version > Imported["DSI-Essenstial"]) {
                const item = localStorage.getItem('ESLVersion');
                if (!item || item != version.toString()) {
                    localStorage.setItem('ESLVersion', version.toString());
                    alert("There is new update for DSI-Essential!Please download it here:" + url);
                } else {
                    console.error("There is new update for DSI-Essential! Please download it here: " + url);
                }
            }
        });
    })
}
// #region Logger
ESL.AbstractLogger = class {
    /**
     * This class handle log in game
     */
    constructor() {

    }
    /**
     * Prefix of this logger
     * @returns {string}
     */
    get prefix() {
        return 'Console';
    }
    /**
     * Log
     * @param  {...any} args 
     */
    log(...args) {
        console.log(`✅ [${this.prefix}]: `, ...args);
    }
    /**
     * Error
     * @param  {...any} args 
     */
    error(...args) {
        console.error(`❌ [${this.prefix}]: `, ...args);
    }
    /**
     * Warn
     * @param  {...any} args 
     */
    warn(...args) {
        console.error(`🟡 [${this.prefix}]: `, ...args);
    }
}
ESL.Logger = new ESL.AbstractLogger();
ESL.checkNewVersion();
// #endregion
// #region Utils
/**
 * Process Plugin Parameters
 * @param {any} paramObject 
 * @returns {any}
 */
ESL.processPluginParameters = function (paramObject) {
    paramObject = { ...paramObject };
    for (k in paramObject) {
        if (k.match(/(.+):(\w+)/i)) {
            var value = paramObject[k];
            delete paramObject[k];
            const paramName = RegExp.$1;
            const paramType = RegExp.$2;
            switch (paramType) {
                case 'struct': case 'obj':
                    value = JSON.parse(value);
                    value = this.processPluginParameters(value);
                    break;
                case 'arr_struct': case 'arr_obj':
                    var array = JSON.parse(value);
                    value = [];
                    for (let i = 0; i < array.length; i++) {
                        var rawStruct = JSON.parse(array[i]);
                        rawStruct = this.processPluginParameters(rawStruct);
                        value.push(rawStruct)
                    }
                    break;
                case 'num': case 'number':
                    value = Number(value);
                    break;
                case 'arr_num':
                    value = JSON.parse(value).map(n => Number(n));
                    break;
                case 'arr': case 'note': case 'array':
                    value = JSON.parse(value);
                    break;
                case 'bool': case 'boolean':
                    value = value === 'true';
                    break;
                case 'vec': case 'vector':
                    value = value.split(",").map(n => Number(n));
                    break;
                case 'vec_str':
                    value = value.split(",");
                    break;
            }
            paramObject[paramName] = value;
        }
    }
    return paramObject;
}
/**
 * Generate UUID
 * @returns {string}
 */
ESL.uuid = function () {
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
// #endregion
// #region RPG Maker Core
/**
 * ------------------------------------------------------------------------------
 * RPG Maker Core
 * ------------------------------------------------------------------------------
 */
ESL.RPG = function () {
    return new Error("This is a static class");
}
/** @type {"MV" | "MZ"} */
ESL.RPG.NAME = Utils && Utils.RPGMAKER_NAME == "MV" ? "MV" : "MZ";
/**
 * Get current scene
 * @returns {Scene_Base}
 */
Object.defineProperty(ESL.RPG, 'curScene', {
    get() {
        return SceneManager._scene;
    },
    enumerable: false,
    configurable: false,
})
/**
 * Find all windows in target scene
 * @param {any} result 
 * @param {Scene_Base} target 
 * @param {string} name 
 * @param {boolean} recursive 
 */
ESL.RPG.findWindows = function (result, target, name, recursive) {
    for (k in target) {
        if (target[k] instanceof Window_Base) {
            result[name] = result[name] || {};
            result[name][k] = target[k];
            if (recursive) {
                this.findWindows(result, target[k], k, false);
            }
        }
    }
}
/**
 * Get All Windows In Current Scene
 * @param {boolean} recursive 
 */
ESL.RPG.getWindows = function (recursive) {
    let scene = this.curScene;
    let result = {};
    let name = scene.constructor.name;
    findWindows(result, scene, name, recursive);
    ESL.Logger.log(result);
}
// #endregion
// #region Bitmap Core
/**
 * ------------------------------------------------------------------------------
 * Bitmap Core
 * ------------------------------------------------------------------------------
 */
ESL.Bitmap = function () {
    return new Error("This is a static class");
}
/**
 * Draw Icon On Target Bitmap
 * @param {Bitmap} targetBitmap 
 * @param {number} iconIndex 
 * @param {number} x 
 * @param {number} y 
 */
ESL.Bitmap.drawIcon = function (targetBitmap, iconIndex, x, y) {
    const bitmap = ImageManager.loadSystem("IconSet");
    const pw = ImageManager.iconWidth || 32;
    const ph = ImageManager.iconHeight || 32;
    const sx = (iconIndex % 16) * pw;
    const sy = Math.floor(iconIndex / 16) * ph;
    targetBitmap.blt(bitmap, sx, sy, pw, ph, x, y);
}
/**
 * Draw A Circle On Bitmap
 * @param {Bitmap} targetBitmap 
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius 
 * @param {string} color 
 * @param {string} color2 
 * @param {number} lineWidth 
 * @param {number} startAngle 
 * @param {number} endAngle 
 * @param {string} joinStyle 
 */
ESL.Bitmap.drawCircle = function (targetBitmap, x, y, radius, color, color2, lineWidth, startAngle, endAngle, joinStyle = "miter") {
    var context = targetBitmap._context;
    context.save();
    if (color2) {
        var grad = context.createLinearGradient(x - radius, y - radius, radius * 2, radius * 2);
        grad.addColorStop(0, color2);
        grad.addColorStop(1, color);
    } else {
        var grad = color;
    }
    context.strokeStyle = grad;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.arc(x, y, radius, startAngle, endAngle, false);
    context.lineJoin = context.lineCap = joinStyle;
    context.stroke();
    context.restore();
    targetBitmap._setDirty();
};
// #endregion
// #region Sprite Core
/**
 * ------------------------------------------------------------------------------
 * Sprite Core
 * ------------------------------------------------------------------------------
 */
ESL.Sprite = function () {
    return new Error("This is a static class");
}
//#endregion
// #region Window Core
/**
 * ------------------------------------------------------------------------------
 * Window Core
 * ------------------------------------------------------------------------------
 */
ESL.Window = function () {
    return new Error("This is a static class");
}
ESL.Window.Grid = class extends Window_Command {
    /**
     * This class handle grid style window
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        super(x, y);
        if (this.isCursorOnTop()) {
            this.addChild(this._windowCursorSprite);
        }
        if (this.backgroundEnabled()) {
            const background = new Sprite(this.backgroundBitmap());
            this.addChildToBack(background);
            this.opacity = 0;
            this.backOpacity = 0;
        }
    }
    /** @inheritdoc */
    maxCols() {
        return 3;
    }
    /**
     * Visible Row
     * @returns {number}
     */
    numVisibleRows() {
        return 3;
    }
    /**
     * If cursor is on top of the window or below
     * @returns {boolean}
     */
    isCursorOnTop() {
        return false;
    }
    /**
     * Background Enable
     * @returns {boolean}
     */
    backgroundEnabled() {
        return false;
    }
    /**
     * Background Bitmap
     * @returns {Bitmap}
     */
    backgroundBitmap() {
        return null;
    }
    /**
     * Item Width
     * @returns {number}
     */
    itemWidth() {
        return 32;
    }
    /**
     * Item Height
     * @returns {number}
     */
    itemHeight() {
        return 32;
    }
    /**
     * Window Width
     * @returns {number}
     */
    windowWidth() {
        return this.itemWidth() * this.maxCols() + this.standardPadding() * 2;
    }
    /**
     * Window Height
     * @returns {number}
     */
    windowHeight() {
        return this.itemHeight() * this.numVisibleRows() + this.standardPadding() * 2;
    }
}
/**
 * Draw Text Auto
 * @param {Window_Base} targetWindow 
 * @param {string} text 
 * @param {'center' | 'left' | 'right'} align 
 * @param {boolean} clearFlag 
 */
ESL.Window.drawText = function (targetWindow, text, align = 'center', clearFlag = false) {
    clearFlag && targetWindow.contents.clear();
    targetWindow.contents.drawText(
        text,
        0,
        0,
        targetWindow.contentsWidth(),
        targetWindow.contentsHeight(),
        align
    );
}
// #endregion
//#region Tween Core
/**
 * ------------------------------------------------------------------------------
 * Tween Core
 * ------------------------------------------------------------------------------
 */
ESL.Tween = function () {
    return new Error("This is a static class");
}
/**
 * Init Tween System
 *   Please include these line to index.html
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/PixiPlugin.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/EasePack.min.js"></script>
 * @returns {void}
 */
ESL.Tween.init = function () {
    if (!window['gsap']) {
        ESL.Logger.error("Please install gsap!");
        return;
    }
    if (!PixiPlugin) {
        ESL.Logger.error("Please install gsap's PixiPlugin!");
        return;
    }
    gsap.registerPlugin(PixiPlugin);
    PixiPlugin.registerPIXI(PIXI);
    ESL.Logger.log("> Successfully init tween library!");
}
ESL.Tween.init();

ESL.Tween.killNext = function () {
    ESL.Tween.killNextTween = true;
}
/**
 * Tween display object to specific state
 * @param {PIXI.DisplayObject} target 
 * @param {any} props 
 * @param {number} duration 
 * @param {string} ease 
 * @param {Function} onFinishCallback
 */
ESL.Tween.to = function (target, props, duration, ease = 'expo.inOut', onFinishCallback = null) {
    if (!gsap) {
        ESL.Logger.error("Please install gsap to use this function!");
        return;
    }
    if (!(target instanceof PIXI.DisplayObject)) {
        ESL.Logger.error("Tween target is invalid!");
        return;
    }
    const newProps = { pixi: { ...props }, duration: duration / 60.0, ease: ease };
    if (onFinishCallback) {
        newProps['onComplete'] = onFinishCallback;
    }
    // If this display object has already had a tween object then kill it
    if (ESL.Tween.killNextTween) {
        target.tweenObject && target.tweenObject.kill();
    }
    const tweenObject = gsap.to(target, newProps);
    target.tweenObject = tweenObject;
    ESL.Tween.forcingNextTween = false;
    ESL.Tween.killNextTween = false;
    return tweenObject;
}
/**
 * Tween display object from a state to specific state
 * @param {PIXI.DisplayObject} target 
 * @param {any} initProps 
 * @param {any} props 
 * @param {number} duration 
 * @param {string} ease 
 * @param {Function} onFinishCallback
 */
ESL.Tween.fromTo = function (target, initProps, props, duration, ease = 'expo.inOut', onFinishCallback = null) {
    for (let k in initProps) {
        target[k] = initProps[k];
    }
    return ESL.Tween.to(target, props, duration, ease, onFinishCallback);
}
/**
 * Tween display object to current state with an offset for each param
 * @param {PIXI.DisplayObject} target 
 * @param {any} props 
 * @param {number} duration 
 * @param {string} ease 
 * @param {Function} onFinishCallback
 */
ESL.Tween.offsetFrom = function (target, props, duration, ease = 'expo.inOut', onFinishCallback = null) {
    let targetProps = {};
    for (let k in props) {
        targetProps[k] = target[k];
        target[k] += props[k];
    }
    return ESL.Tween.to(target, targetProps, duration, ease, onFinishCallback);
}
/**
 * Tween display object to new state with an offset for each param
 * @param {PIXI.DisplayObject} target 
 * @param {any} props 
 * @param {number} duration 
 * @param {string} ease 
 * @param {Function} onFinishCallback
 */
ESL.Tween.offsetTo = function (target, props, duration, ease = 'expo.inOut', onFinishCallback = null) {
    let targetProps = {};
    for (let k in props) {
        targetProps[k] = target[k] + props[k];;
    }
    return ESL.Tween.to(target, targetProps, duration, ease, onFinishCallback);
}
// #endregion
// #region Math Core
/**
 * ------------------------------------------------------------------------------
 * Math Core
 * ------------------------------------------------------------------------------
 */
ESL.Math = function () {
    return new Error("This is a static class");
}
/**
 * Get random float number from 0 to 1 (excluded)
 * @returns {number}
 */
ESL.Math.random = function() {
    return Math.random();
}
/**
 * Get a random number from min to max (included)
 * @param {number} min 
 * @param {number} max 
 */
ESL.Math.randomInt = function(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}
/**
 * Clamp a value in a specific range
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 */
ESL.Math.clamp = function(value, min, max) {
    return Math.max(Math.min(value, max), min);;
}
/**
 * Remap a value from a specific range to another range
 * @param {number} value 
 * @param {number} low1 
 * @param {number} high1 
 * @param {number} low2 
 * @param {number} high2 
 * @returns 
 */
ESL.Math.remap = function(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
// #endregion
//#region Array Core
/**
 * ------------------------------------------------------------------------------
 * Array Core
 * ------------------------------------------------------------------------------
 */
ESL.Array = function () {
    return new Error("This is a static class");
}

/**
 * Get random element from an array
 * @template T
 * @param {Array<T>} array 
 * @returns {T}
 */
ESL.Array.randomElement = function (array) {
    return array[Math.floor(Math.random() * array.length)];
}
/**
 * Shuffle an array
 * @template T
 * @link https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param {Array<T>} array 
 * @returns {Array<T>}
 */
ESL.Array.shuffle = function (array) {
    let currentIndex = array.length
    let randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
/**
 * Return a new copy of an array that dont contains falsy values.
 * @template T
 * @param {Array<T>} array 
 * @returns {Array<T>} an array with all falsy values removed
 */
ESL.Array.compact = function (array) {
    return array.filter(Boolean);
}
/**
 * uniq
 * @template T
 * @param {Array<T>} array - List of elements
 * @param {Boolean} [sort=false] - optional flag to sort
 * @return {Array<T>} Returns uniq values list
 */
ESL.Array.uniq = function (array, sort = false) {
    return sort ? [...new Set(array)].sort() : [...new Set(array)];
}
/**
 * intersection
 * @template T
 * @param {...*} args - List of arrays
 * @return {Array<T>} Returns a list of unique values
 */
ESL.Array.intersection = function (...args) {
    const [first, ...rest] = args;
    return first.filter(item => rest.flat().includes(item));
}
/**
 * diff
 * @template T
 * @param {...*} args - List of arrays
 * @return {Array<T>} Returns result of excluded values
 */
ESL.Array.diff = function (...args) {
    const [first, ...rest] = args;
    return first.filter(item => !rest.flat().includes(item));
}
/**
 * Return a list of all object that match multiple condition
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {T} propList 
 */
ESL.Array.where = function (list, propList) {
    return list.filter((object) => {
        return Object.keys(propList).every(prop => {
            return object[prop] == propList[prop];
        });
    });
}
/**
 * Return the first object in the array that match multiple condition
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {T} propList 
 */
ESL.Array.findWhere = function (list, propList) {
    for (let object of list) {
        const status = Object.keys(propList).every(prop => {
            return object[prop] == propList[prop];
        });
        if (status) return object;
    }
    return null;
}
/**
 * Group object by a specific property
 * 
 * @template T
 * @param {Array<T>} list 
 * @param {string} propName 
 * @return {Object.<string, Array<T>}
 */
ESL.Array.groupBy = function (list, propName) {
    /** @type {Object.<string, Array<T>} */
    const map = {}
    list.forEach(object => {
        const array = map[object[propName]] || [];
        if (array.length == 0) {
            map[object[propName]] = array;
        }
        array.push(object);
    });
    return map;
}

/**
 * Dynamic sort an array base on element's property
 * @template T
 * @param {Array<T>} array 
 * @param {string} property 
 */
ESL.Array.dynamicSort = function (array, property) {
    let sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return array.sort(function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    });
}

/**
 * Dynamic sort an array base on multiple element's property
 * @template T
 * @param {Array<T>} array 
 * @param {string[]} properties 
 */
ESL.Array.dynamicSortEx = function (array, properties) {
    var props = properties;
    function dynamicSort(property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }
    return array.sort(function (obj1, obj2) {
        var i = 0, result = 0, numberOfProperties = props.length;
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
        while (result === 0 && i < numberOfProperties) {
            result = dynamicSort(props[i])(obj1, obj2);
            i++;
        }
        return result;
    });
}

// #endregion
/**
 * ------------------------------------------------------------------------------
 * DateTime Core
 * ------------------------------------------------------------------------------
 */
// #region Date Timer
ESL.DateTime = function () {
    return new Error("This is a static class");
}
/**
 * Format In-game frames to real time format.
 * @param {number} frames 
 * @param {boolean} showMins 
 * @param {boolean} showHours 
 * @returns {string}
 */
ESL.DateTime.convertFrameToRealLifeFormat = function (frames, showMins = false, showHours = false) {
    let seconds = Math.floor(frames / 60);
    let mins = Math.floor(frames / 3600);
    let hours = Math.floor(frames / 216000);
    let text = '';
    if (showMins) {
        seconds %= 60;
        text = `${mins}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");
    }
    if (showMins && showHours) {
        mins %= 60;
        text = `${hours}`.padStart(2, "0") + ":" + `${mins}`.padStart(2, "0") + ":" + `${seconds}`.padStart(2, "0");
    }
    return text;
}
// #endregion
//#region Save Core
/**
 * ------------------------------------------------------------------------------
 * Save Core
 * ------------------------------------------------------------------------------
 */
ESL.SaveableObject = class {
    /**
     * This array will contains multiple array which has 2 values [propetyName, defaultValue].
     * For example [{name: 'Test', defaultValue: 10}]
     * @returns {any[]}
     */
    saveProperties() {
        return [];
    }
    /**
     * Get Save Data
     * @returns {Object} 
     */
    getSaveData() {
        const result = {};
        this.saveProperties().forEach(([property, _]) => {
            let data = this[property];
            if (property.match(/@Arr\((.+?)\):(.+)/i)) {
                property = RegExp.$2;
                const array = this[property] || [];
                const newData = [];
                for (const entry of array) {
                    newData.push(entry.getSaveData());
                }
                data = newData;
            }
            // if (property.match(/@Map\((.+?)\):(.+?)/i)) {
            //     const klass = RegExp.$1;
            //     data = this[RegExp.$2];
            //     let newData = {};
            //     for (const [key, value] of data) {
            //         newData[key] = value.getSaveData();
            //     }
            //     data['special'] = `Map(${klass})`;
            //     data = newData;
            // }
            if (this[property] instanceof ESL.SaveableObject) {
                data = this[property].getSaveData();
                data['klass'] = this[property].constructor.name;
            }
            result[property] = data;
        })
        return (result);
    }
    /**
     * Load Save Data
     * @param {Object} savedData 
     */
    loadSaveData(savedData) {
        this.saveProperties().forEach(([property, defaultValue]) => {
            let value = savedData[property];
            if (property.match(/@Arr\((.+?)\):(.+)/i)) {
                const klass = RegExp.$1;
                property = RegExp.$2;
                const array = savedData[property];
                const newData = [];
                for (const entry of array) {
                    const obj = eval(`new ${klass}()`);
                    obj.loadSaveData(entry)
                    newData.push(obj);
                }
                value = newData;
            }
            if (value && value.klass) {
                value = eval(`new ${value.klass}()`);
                value.loadSaveData(savedData[property]);
            }
            this[property] = value != undefined ? value : defaultValue;
        })
    }
}
//#endregion
//#region RPG MAKER APDAPTATION
var DSI_Essential_Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function () {
    DSI_Essential_Game_System_initialize.call(this);
    this.recreateESLSaveableObjects();
}

Game_System.prototype.createESLSaveableObjects = function () {
    // To be aliased by other plugins
}

Game_System.prototype.recreateESLSaveableObjects = function () {
    this.createESLSaveableObjects();
    const savedData = this.mySavedData;
    for (let key in savedData) {
        const object = this[key];
        const data = savedData[key];
        if (object instanceof ESL.SaveableObject) {
            object.loadSaveData(data);
        }
    }
}

var DSI_Essential_Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
Game_System.prototype.onBeforeSave = function () {
    DSI_Essential_Game_System_onBeforeSave.call(this);
    const savedData = {};
    for (let key in this) {
        const object = this[key];
        if (object instanceof ESL.SaveableObject) {
            savedData[key] = object.getSaveData();
            delete this[key];
        }
    }
    this.mySavedData = savedData;
};

var DSI_Essential_DataManager_saveGame = DataManager.saveGame;
DataManager.saveGame = function (savefileId) {
    const result = DSI_Essential_DataManager_saveGame.call(this, savefileId);
    if (result instanceof Promise) {
        // For MZ support
        return new Promise((resolve, reject) => {
            result.then((res) => {
                $gameSystem.recreateESLSaveableObjects();
                resolve(res);
            })
        })
    }
    if (result) {
        $gameSystem.recreateESLSaveableObjects();
    }
    return result;
}

var DSI_Essential_DataManager_loadGame = DataManager.loadGame;
DataManager.loadGame = function (savefileId) {
    const result = DSI_Essential_DataManager_loadGame.call(this, savefileId);
    if (result instanceof Promise) {
        // For MZ support
        return new Promise((resolve, reject) => {
            result.then((res) => {
                $gameSystem.recreateESLSaveableObjects();
                resolve(res);
            })
        })
    }
    if (result) {
        $gameSystem.recreateESLSaveableObjects();
    }
    return result;
};
//#endregion
//========================================================================
// END OF PLUGIN
//========================================================================