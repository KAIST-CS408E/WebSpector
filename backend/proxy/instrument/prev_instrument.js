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
                //'height' : true,
                //'width' : true
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
        //console.log(JSON.stringify(log_buffer));
        log_buffer = [];
        setTimeout(send_log, 3000);
    }

    function getStackTrace() {
        var stack = "unknown";

        try {
        throw new Error();
        } catch (err) {
        stack = err.stack.split('\n');
        stack = stack[stack.length - 1];
        }

        return stack;
    }

    function instrumentProperty(object, objectName,  propertyName, logfunc) {
        var propDesc = Object.getPropertyDescriptor(object, propertyName);

        if(propDesc === undefined) return;

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

                if(!logfunc) {
                  log_buffer.push({
                    'name' : objectName + '.' + propertyName,
                    'property': origProperty,
                    'location': window.location.href,
                    'trace': getStackTrace(),
                    'time' : new Date().getTime()
                  });
                } else {
                  logfunc(objectName, propertyName, origProperty, window.location.href, getStackTrace(), new Date().getTime());
                }

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
    }

    function instrumentDynamic(x) {
      instrumentProperty(x, 'dynamic.style', 'fontFamily', function(objectName, propertyName, value, location, tr, time) {
        log_buffer.push({
            'name' : objectName + '.' + propertyName,
            'property': value['fontFamily'],
            'location': location,
            'trace': tr,
            'time' : time
          });
        });
    }


    function instrumentDynamicElement() {
        var propDesc = Object.getPropertyDescriptor(document, 'createElement');

            var originalGetter = propDesc.get;
            var originalSetter = propDesc.set;
            var originalValue = propDesc.value;
            // We overwrite both data and accessor properties as an instrumented
            // accessor property
            Object.defineProperty(document, 'createElement', {
            configurable: true,
            get: (function() {
              return function(tagname) {
                var x = originalValue.call(document, tagname);
                instrumentDynamic(x);
                return x;
              }
            }),
                set: originalSetter
                });
        }

    function instrumentGPS() {
        var propDesc = Object.getPropertyDescriptor(window.navigator.geolocation, 'getCurrentPosition');

            var originalGetter = propDesc.get;
            var originalSetter = propDesc.set;
            var originalValue = propDesc.value;
            // We overwrite both data and accessor properties as an instrumented
            // accessor property
            Object.defineProperty(window.navigator.geolocation, 'getCurrentPosition', {
            configurable: true,
            get: (function() {
              return function(callback) {
                var x = originalValue.call(window.navigator.geolocation, callback);
                log_buffer.push({
                'name' : 'GPS location',
                'property': [],
                'location': window.location.href,
                'trace': getStackTrace(),
                'time' : new Date().getTime()
                });
                return x;
              }
            }),
                set: originalSetter
                });

    }

    function instrumentEventListener() {
        var propDesc = Object.getPropertyDescriptor(window, 'addEventListener');

            var originalGetter = propDesc.get;
            var originalSetter = propDesc.set;
            var originalValue = propDesc.value;
            // We overwrite both data and accessor properties as an instrumented
            // accessor property
            Object.defineProperty(window, 'addEventListener', {
            configurable: true,
            get: (function() {
              return function(type, listener, options) {
                var x = originalValue.bind(window)(type, listener, options);
                log_buffer.push({
                'name' : 'EventListener',
                'property': arguments[0],
                'location': window.location.href,
                'trace': getStackTrace(),
                'time' : new Date().getTime()
                });
                return x;
              }
            }),
                set: originalSetter
                });
    }



    instrumentDynamicElement();
    instrumentGPS();
    instrumentEventListener();

    instrumentTree(monitorD['window'], 'window');
    setTimeout(send_log, 10000);
}
