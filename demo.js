var querystring = require("querystring")
var http = require("http")
var https = require("https")
var fs = require("fs")
var async = require("async")
var debug = require("debug")('wbf-test')
var path = require("path");
var iconv = require('iconv-lite');
var cheerio = require("cheerio");

var defalutConfig = {
	tok: "my token",
	tex: "",
	cuid: "wbf_s_server",
	ctp: 1,
	lan: "zh"	
}

/*
q1 ip - session can't tell user
q2 content 存储最近的用户的内容 即使是数组也只能存储少量用户的内容，而且还需要定期清理
 */

var content = null

http.createServer((req, res)=>{ 

	var userId = req.headers['host'].split(':')[0]
	var lastPath = null;

	async.waterfall([
		//检查用户文件是否存在
		function(callback) {
			initFunc(userId, function(err, config, lastBook) {
				if(err) {
					fs.appendFile('./' + userId + '/error', err, (err2) => {
					  if (err2) return callback(err2)
					  else return callback(null, err)
					});
				}
				else {
					return callback(null, null, config, lastBook)
				}
			})
		},
		//检查并更新 text
		function(errMsg, config, lastBook, callback) {
			if(config == null) config = defalutConfig
			
			if(errMsg) {
				config['tex'] = errMsg
				return callback(null, config)
			}

			if(content == null || content.length < 333) {
				getContent(lastBook, function(err, data) {
					if(err) return callback(err)
					content == null ? content = data : content += data
					var text = content.substr(0, 333)
					content = content.substr(333)
					config['tex'] = text
					return callback(null, config)
				})
			}
			else {
				var text = content.substr(0, 333)
				content = content.substr(333)
				config['tex'] = text

				return callback(null, config)
			}			

		},
		//访问tsn 并保存至内存
		function(config, callback) {
			getMp3(config, function(err, buffer) {
				// net problam
				if(err) return callback(err)
				callback(null, buffer)
			})
		}
	],
	// 最后 发送给 web
	function(err, result) {
		if (err) {
			try {
				console.log(err)
				result = fs.readFileSync('./error.mp3')
				fs.appendFileSync('./log', err);
			} catch (e) {
				throw e
			}
		}
		var length = Buffer.byteLength(result)
	    res.writeHead(200, {
	        'Content-Type' : 'audio/mp3',
	        'Accept-Ranges' : 'bytes',
	        'Content-Length': length,
	        'Content-Ranges': 'bytes 0-' + length + '/' + length,
	        'Cache-Control': 'no-store'
	    });
	    res.end(result);	
	})

}).listen(3000)
console.log('服务器已启动....')

/*
读取 *本地* 用户关于 tsn 的配置文件、log中记录的上次阅读的书名和停止位置
目前用户仅为本地一人
dir:
- userid
	- error
	- log.json
	- config.json
	- bookname（cache file）
		- cache.mp3
		- ...
Parameters:
userid - 用户唯一标志
callback
	- err 错误
	- config
	- lastBook
Error：
	文件不存在
 */
var initFunc = function(userId, callback) {
	path = './' + userId + '/'

	async.parallel([
		function(callback) {
			fs.readFile(path + 'config.json', (err, data) => {
				if(err) callback(err)
				else callback(null, data)
			})
		},
		function(callback) {
			fs.readFile(path + 'log.json', (err, data) => {
				if(err) callback(err)
				else callback(null, data)
			})
		}
	],
	function(err, results) {
		if(err) return callback(err)
		
		var config
		var lastBook

		try {
		  config = JSON.parse(results[0])
		  lastBook = JSON.parse(results[1])['lastBook']
		} catch (e) {
		  return callback(e)
		}
		callback(null, config, lastBook)
	})
}

/*
根据配置文件调用 tsn api，保存返回结果。
Parameters:
config - 用户配置
callback 
	- err
	- buffer
 */
var getMp3 = function(config, callback) {
	

	config['tex'] = encodeURIComponent(config['tex'])
	body = querystring.stringify(config)
	var opt = {
	    method: "POST",
	    host: "tsn.baidu.com",
	    path: "/text2audio",
	    headers: {
	        "Content-Type": 'application/x-www-form-urlencoded',
	        "Content-Length": Buffer.byteLength(body)
	    }
	}
    
    var req = http.request(opt, function(res) {
		
		var chunks = []
		var size = 0
		var contentType = res.headers['content-type']

		res.on('data', function(chunk){
	        chunks.push(chunk)
	        size += chunk.length
	    });

    	if(contentType == "application/json"){
			res.setEncoding('utf8')
		    res.on('end', () => {
		    	var data = '' 
	  			chunks.forEach(function(v, i) {
	  				data += v
	  			})
		    	callback(new Error(data))		    	
		    });
		} else {
			res.on('end', () => {
				var data
				if(chunks.length == 0) data = new Buffer(0)
				else 
					if(chunks.length == 1) data = new chunks[0]
					else {
						data = new Buffer(size)
						for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {  
					    	var chunk = chunks[i];  
					    	chunk.copy(data, pos);  
					    	pos += chunk.length;  
					    } 
					}
				console.log('No more data in response.');
		    	callback(null, data)
		    });
		}
    })

    req.on('error', function(e) {
    	return callback(e)
    })

    req.write(body)
    req.end()
}

// /*
// 根据配置文件调用 tsn api，将返回流 pipe 到 response 中。
// Parameters:
// config - 用户配置
// text - 文本
// callback 
// 	- err
// 	- readbleSteam
//  */
// var getMp3 = function(config, text, callback) {
// 	text = encodeURIComponent(text)
// 	config['tex'] = text
// 	body = querystring.stringify(config)

// 	var opt = {
// 	    method: "POST",
// 	    host: "tsn.baidu.com",
// 	    path: "/text2audio",
// 	    headers: {
// 	        "Content-Type": 'application/x-www-form-urlencoded',
// 	        "Content-Length": Buffer.byteLength(body)
// 	    }
// 	}
//     var req = http.request(opt, function(res) {
//     	if(res.headers['content-type'] == 'application/json') {
//     		res.setEncoding('utf8')
//     		var msg
//     		res.on('data', function(data){
// 		        msg += data
// 		    });
// 		    res.on('end', function() {
// 		    	callback(new Error(msg))
// 		    	return 
// 		    })
//     	}
//     	else {
//     		callback(null, res)
//     	}
//     })
//     req.on('error', function(e) {
//     	callback(e)
//     	return
//     })
//     req.write(body)
//     req.end()
// }

/*
做成**通用型**的网站读取工具

第一版 做出根据网址累加读取的就好了
即使做成异步的 因为用了 waterfall 也会等待完成 先做成同步的

Parameters:
lastBook - object - address
				  - index
				  - [屏蔽集]暂时没有
callback - function - err
					- data
 */
var getContent = function(lastBook, callback) {
	var paths = lastBook['path'].split('/')
	//写回
	paths[paths.length - 1] = (lastBook['lastIndex']++) + ".html"
	var options = {
		hostname: lastBook['hostname'],
		port: lastBook['port'],
		path: paths.join("/"),
		method: "GET"
		// timeout: 3000
	}
	var req = https.request(options, function(res){
		var buffer = [];
  
		res.on('data', function(chunk){
			buffer.push(chunk);
		})

		res.on("end",function(){
			buffer = iconv.decode(Buffer.concat(buffer), 'gbk')
		    var html=buffer.toString('utf8');
		    var $=cheerio.load(html);
		    var content = $('#' + lastBook['contentId']).text();
		    return callback(null, content)
		})
	})
	req.on("error", function(err) {
		return callback(err)
	})
	req.end()
}