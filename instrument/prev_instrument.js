var monitorD = {
    'window' : {
        'navigator' : {
            'appCodeName' : { '' : true },
            'appName' : { '' : true },
            'appVersion' : { '' : true },
            'cookieEnabled' : { '' : true },
            'geolocation' : { '' : true },
            'language' : { '' : true },
            'languages' : { '' : true },
            'onLine' : { '' : true },
            'oscpu' : { '' : true },
            'platform' : { '' : true },
            'product' : { '' : true },
            'productSub' : { '' : true },
            'userAgent' : { '' : true },
            'vendorSub' : { '' : true },
            'vendor' : { '' : true },
            'plugins' : { '' : true }
        },
        'document' : {
            'hasStorageAccess' : { '' : true },
            'requestStorageAccess' : { '' : true }
        },
        'WebGL2RenderingContext' : {
        },
        'WebGLRenderingContext' : {
        },
        'screen' : {
        },
        'name' : {
        },
        'localStorage' : {
        },
        'sessionStorage' : {
        },
        'HTMLCanvansElement' : {
        }
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

            console.log(objectName + '.' + propertyName + origProperty +
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
            console.log(objectName + '.' + propertyName + value +
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
