if (Object.alreadyInjected === undefined)
{
    Object.alreadyInjected = true;
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
                'deviceMemory' : true,
                'hardwareConcurrency' : true,
                'plugins' : true
            },
            'document' : {
                'hasStorageAccess' : true,
                'requestStorageAccess' : true,
                'cookie' : true,
                'fonts' : true
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

    var log_buffer = []

    function send_log() {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '${proxy_dest}', true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify(log_buffer));
        log_buffer = [];
        setTimeout(send_log, 10000);
    }

    function getStackTrace() {
        var stack;

        try {
        throw new Error();
        } catch (err) {
        stack = err.stack;
        }

        return stack;
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
                    return;
                }

                log_buffer.push({
                    'name' : objectName + '.' + propertyName,
                    'property': origProperty,
                    'location': document.location.href,
                    'trace': getStackTrace(),
                    'time' : new Date().getTime()
                });
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
                    return value;
                }

                // return new value
                return returnValue;
                }
            })()
            });
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
        setTimeout(send_log, 10000);
    }

    instrumentTree(monitorD['window'], 'window');
}
