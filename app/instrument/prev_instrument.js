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

    function send_log(log_json) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", '${proxy_dest}', true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(log_json)
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

                send_log({
                    'name' : objectName,
                    'property': origProperty,
                    'location': document.location,
                    'trace': getStackTrace()
                });
                return origProperty;
                }
            })(),
            set: propDesc.set
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
    }

    instrumentTree(monitorD['window'], 'window');
}
