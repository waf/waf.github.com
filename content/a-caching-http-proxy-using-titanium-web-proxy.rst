A Caching HTTP Proxy using Titanium Web Proxy
#############################################

:date: 2019-01-19
:tags: [dotnet, web, tools]

At my work at Jetabroad I do a lot of integration with third-party webservices (like everyone these days).
The webservices, especially the test endpoints, are of variable stability and responsiveness.

The responsiveness issue can be maddening when you're trying to iterate quickly. I prefer doing
the bulk of my development via unit tests or integration tests to isolate myself as much as possible.
However, I still ultimately find myself developing directly against these third-party services from
time to time.

I built `Catchy`_ to help solve this pain. When you start it, you provide a whitelist of domains to
intercept. Catchy will examine your outbound REST or SOAP requests to those domains, and then
cache the inbound response based on the hash of the outbound request.

.. image:: https://raw.githubusercontent.com/waf/catchy/master/demo.gif
   :width: 80%
   :align: center

Titanium Web Proxy -- an amazing library
----------------------------------------

Early prototypes were originally built on top of Fiddler Core, but after Fiddler Core was killed by
Telerik, I transitioned it over to the excellent `Titanium Web Proxy`_ project. It makes intercepting
and analyzing requests, even over TLS, very straightforward.

The proxy code itself is straightforward. The following snippet of Titanium Web Proxy code allows
you to intercept HTTP and HTTPS requests (via HTTP 1.1 and HTTP2!) and run arbitrary C# functions
to inspect / modify the requests and responses:

.. code-block:: csharp

    var proxyServer = new ProxyServer();
    var explicitEndPoint = new ExplicitProxyEndPoint(ipAddress, port, true);

    proxyServer.EnableHttp2 = true;
    proxyServer.CertificateManager.CreateRootCertificate(false);
    proxyServer.CertificateManager.TrustRootCertificate();
    proxyServer.AddEndPoint(explicitEndPoint);

    // specify your callbacks here
    explicitEndPoint.BeforeTunnelConnectRequest += BeforeTunnelConnectRequest;
    proxyServer.BeforeRequest += OnRequestHandler;
    proxyServer.BeforeResponse += OnResponseHandler;
    proxyServer.ExceptionFunc = OnErrorFunc;

    proxyServer.Start();
    proxyServer.SetAsSystemProxy(explicitEndPoint, ProxyProtocolType.AllHttp);

It's rare to find a network library that works completely as advertised, and exposes a complex
concept behind an easy to understand API. Well done to them!

.. _Catchy: https://github.com/waf/catchy
.. _Titanium Web Proxy: https://github.com/justcoding121/Titanium-Web-Proxy
