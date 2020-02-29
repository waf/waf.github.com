Native Websockets with Blazor WebAssembly
#########################################

:date: 2020-02-01
:tags: [dotnet, web, blazor, wasm]

A couple of days ago, Blazor WebAssembly 3.2.0 Preview 1 was released (announcement_). I'm personally excited about this release
because it's the first Blazor release that contains native support for client-side websockets!

Previously, if you wanted to use websockets, you either had to write your own wrapper, or use a larger library like
SignalR that did the wrapping for you. However, if you just wanted to use the normal ``System.Net.WebSockets.ClientWebSocket`` class that's built into .NET, you could not.

The Mono/WASM project has actually supported ``ClientWebSocket`` for about a year (`PR 12615`_). However, some recent changes in Blazor allowed the Blazor project to be able to consume them (`PR 10489`_).
The ClientWebSocket implementation is ultimately just `wrapping the JS interop`_ for you, but this greatly simplifies your code and removes third-party libraries from your project.

Here's an example class that uses a ClientWebSocket in a Blazor chat client of mine, all bundled up neatly into the new ``IAsyncEnumerable`` feature of C#8:

.. code-block:: csharp

    public class ChatClientConnection
    {
        private readonly ClientWebSocket websocket;
        private readonly Uri websocketUrl;

        public ChatClientConnection(ClientWebSocket websocket, Uri websocketUrl)
        {
            this.websocket = websocket;
            this.websocketUrl = websocketUrl;
        }

        /// <summary>
        /// Connect to the websocket and begin yielding messages
        /// received from the connection.
        /// </summary>
        public async IAsyncEnumerable<string> ConnectAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            await websocket.ConnectAsync(websocketUrl, cancellationToken);
            var buffer = new ArraySegment<byte>(new byte[2048]);
            while (!cancellationToken.IsCancellationRequested)
            {
                WebSocketReceiveResult result;
                using var ms = new MemoryStream();
                do
                {
                    result = await websocket.ReceiveAsync(buffer, cancellationToken);
                    ms.Write(buffer.Array, buffer.Offset, result.Count);
                } while (!result.EndOfMessage);

                ms.Seek(0, SeekOrigin.Begin);

                yield return Encoding.UTF8.GetString(ms.ToArray());

                if (result.MessageType == WebSocketMessageType.Close)
                    break;
            }
        }

        /// <summary>
        /// Send a message on the websocket.
        /// This method assumes you've already connected via ConnectAsync
        /// </summary>
        public Task SendStringAsync(string data, CancellationToken cancellation)
        {
            var encoded = Encoding.UTF8.GetBytes(data);
            var buffer = new ArraySegment<byte>(encoded, 0, encoded.Length);
            return websocket.SendAsync(buffer, WebSocketMessageType.Text, endOfMessage: true, cancellation);
        }
    }

What I love about this is it's just normal .NET code -- no third-party libraries at all, and it just works flawlessly when compiled to WebAssembly. Happy WASMing!

.. _announcement: https://devblogs.microsoft.com/aspnet/blazor-webassembly-3-2-0-preview-1-release-now-available/
.. _PR 12615: https://github.com/mono/mono/pull/12615
.. _PR 10489: https://github.com/dotnet/aspnetcore/issues/10489
.. _wrapping the JS interop: https://github.com/mono/mono/blob/a2d1aec5d2c01483738dfa6e69202462bca68e2b/sdks/wasm/framework/src/WebAssembly.Net.WebSockets/ClientWebSocket.cs
