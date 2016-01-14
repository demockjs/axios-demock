(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.axiosDemock = factory();
    }
}(this, function () {
    'use strict';

    function mixin(target) {
        var sources = Array.prototype.slice.call(arguments, 1);

        while (sources.length) {
            var source = sources.shift();

            for (var prop in source) {
                target[prop] = source[prop];
            }
        }

        return target;
    }

    return {
        intercept: function (axios, demock) {
            axios.interceptors.request.use(function (config) {
                var demockRequest = {
                    url: config.url,
                    method: config.method.toUpperCase(),
                    params: mixin({}, config.params, config.data),
                    headers: mixin({}, config.headers)
                };

                demock.filterRequest(demockRequest);

                config.url = demockRequest.url;
                config.method = demockRequest.method.toLowerCase();

                config.__demockRequest = demockRequest;

                return config;
            });

            axios.interceptors.response.use(function (response) {
                var demockRequest = response.config.__demockRequest;

                var demockResponse = {
                    statusCode: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    headers: response.headers
                };

                demock.filterResponse(demockRequest, demockResponse);

                return new Promise(function (resolve, reject) {
                    function handleResponse() {
                        response.status = demockResponse.statusCode;
                        response.statusText = demockResponse.statusText;
                        response.data = demockResponse.data;
                        response.headers = demockResponse.headers;

                        if (demockResponse.timeout) {
                            response.statusCode = 0;
                            reject(response);
                        } else if (demockResponse.statusCode >= 400 && demockResponse.statusCode < 600) {
                            reject(response);
                        } else {
                            resolve(response);
                        }
                    }

                    if (demockResponse.delay) {
                        setTimeout(handleResponse, demockResponse.delay);
                    } else {
                        handleResponse();
                    }
                });
            });

        }
    };
}));
