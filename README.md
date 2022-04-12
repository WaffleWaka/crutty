# crutty
A simple SSH2 / telnet wrapper class for Node.js


### Install
> npm i crutty

### Limitations
The SSH implementation accepts any/all algorithms available to it with complete disregard for security.
All SSH connections require the `ssh_username` and `ssh_password` parameter. Some servers will still require post-SSH connection authentication
All data is decoded to UTF8 by default. This can be modified by changing the `_decoder` propery

### Usage
```javascript
const crutty = require("crutty")
let connection = new crutty()
connection.connect({
	host: "192.168.1.1",
	protocol: "ssh",
	ssh_username: "admin",
	ssh_password: "admin",
	timeout: 3000,
	callback: processData,
	onError: handleError,
	onClose: noop,
})

function processData (data, cruttyConnection) {
	if (data.match(/\w*#/)){
		cruttyConnection.write("ls\r\n")
	} else {
		cruttyConnection.end()
	}
}

function handleError (argumentsArray, cruttyConnection){
	console.log("Connection closed unexpectedly", cruttyConnection.sessionState)
}
```

## .connect() Parameters:

**host**: String. Either IP address or hostname

**protocol**: String. Either `"ssh"` or `"telnet"`

**port**: Integer (optional). If not specified, assumes port 22 for SSH and 23 for telnte

**ssh_username**: String. Not used for telnet connections. Mandatory for SSH connections

**ssh_password**: String. Not used for telnet connections. Mandatory for SSH connections

**timeout**: Integer (optional) in miliseconds. Defaults to 1500ms

**callback**: function. This function will be passed a string from the connection for the first variable, and a cruttyConnection object as the second variable

**onError**: function (optional). This function will be passed all arguments from the SSH2 or telnet-client library as the first variabl, and a cruttyConnection object as the second variable

**onClose**: function (optional). This function will only be called if the connection was ended by the client. No arguments are passed to the function. 

## cruttyConnection Methods
`cruttyConnection.read(returnFullSessionText)`: If `returnFullSessionText` is `true`, it retuns the full text of the terminal session. Setting `returnFullSessionText` to `false` will return nothing. This method is called immediately before callback function, thus its buffer should always be empty. All text is decoded as utf8

`cruttyConnection.readRaw(returnFullSessionText)`: If returnFullSessionText is `false`, this method returns a non-decoded a Buffer array containing any/all data not retrieved since the last time `readRaw` was called. If it is `true`, it will return the entire terminal session as a Buffer array

`cruttyConnection.write("text")`: Writes the text to the stream. Note that if the server echos keystrokes, anything sent with the `write()` command will also come back as data through the callback. Also note that if the socket is busy for any reason, the command will be queued and sent as soon as its able to.

`cruttyConnection.writeWhenReady("text")`: Adds the text to a queue to be sent as asoon as the socket is ready

`cruttyConnection.end()`: Does exactly what you think it does

## cruttyConnection Properties
`sessionState` Object. 

  -`state` String. Always either `"ready"` or `"error"`

  -`subState` String. One of `connected`, `ready`, `writedone`, `dataWaiting`, `timeout`, `failedLogin`, `rgs`, `end`, `close`, `error`, `end`, `close`, `dataWaiting`, or `finish`


`onData` Function. This is the same callback function from the connect() method

`onError` Function. This is the same callback function from the connect() method

`onClose` Function. This is the same callback function from the connect() method

`_decoder` Function. This is a UTF8 decoder by default (`new StringDecoder("utf8")`), but can be swapped out for your own

`_sessionText` String. Full text of the session, less anything still in the `_buffer`

`_sessionRaw` Array. This is not a proper Buffer object, but a standard Array. Full data of the session, less anything still in the `_bufferRaw`

`_buffer` String. Last text from the socket

`_bufferRaw` Array. This is not a proper Buffer object, but a standard Array. Can be decoded using a StringDecoder object

`_socket` Object. This will be specific to the protocol being used, and the library using that protocol. Should probably be left alone, but I'm not your mom so have fun






## Disclaimer
This wrapper class was made to be able to use one simple set of functions for both Telnet and SSH2 with complete disregard for security. Telnet is by definition insecure and SSH2 implementation here accepts any/all algorithms blindly. This software is provided “as is”, without warranty of any kind, express or implied,
License: MIT


