

GosUpload = (function (w, d) {

  class GosUpload {
    ak = ''
    sk = ''
    size = 50 * 1024 * 1000
    fileArr = []
    constructor(option) {
      this.option = {
        host: option.host,
        key: option.key,
        bucketName: option.bucketName,
        bucketPath: option.bucketPath || '/default',
        error: option.error || function() {},
        beforeUpload: option.beforeUpload || function() {},
        uploadProgress: option.uploadProgress || function() {},
        fileUploaded: option.fileUploaded || function() {},
        ifAsync: String(option.ifAsync) !== 'false',
        inseconds: '3000',
        stsPath: '/api/sts',
        uploadPath: '/api/upload-filter-celebrity',
        initPart: '/api/init-part',
        uploadPart: '/api/upload-part',
        compPart: '/api/parts-complete',
        abortPart: '/api/parts-abort',
        getMediaMeta: '/api/get-media-meta-data'
      }
    }
  }

// 设置文件路径
  GosUpload.prototype.bucketPathSet = function(name) {
    this.option.bucketPath = name
  }

// 开始上传
  GosUpload.prototype.start = function() {
    var that = this
    for (var i in this.fileArr) {
      if (!that.fileArr[i].ignore) {
        this.upload2(that.fileArr[i]).then(function(res) {
          if (res.retCode !== 0) {
            that.option.error(res)
          }
        }).catch(function(res) {
          that.option.error(res)
        })
      }
    }
  }

// 按照签名规则拼接query字符串
  GosUpload.prototype.getCanonicalQueryString = function(queryData) {
    // console.log('拼接query')
    var canonicalQueryString = []
    for (var i in queryData) {
      canonicalQueryString.push(encodeURIComponent(i.trim()) + '=' + encodeURIComponent(queryData[i].trim()))
    }
    return canonicalQueryString.sort().join('&')
  }

// 按照签名规则拼接header字符串
  GosUpload.prototype.getCanonicalHeaders = function(headerData) {
    // console.log('拼接header')
    var canonicalHeaders = []
    for (var i in headerData) {
      canonicalHeaders.push(encodeURIComponent(i.trim().toLowerCase()) + ':' + encodeURIComponent(headerData[i].trim()))
    }
    return canonicalHeaders.sort().join('\n')
  }

// 按照签名规则获得authorization
  GosUpload.prototype.getAuthorization = function(queryData, headerData, type, skFlag) {
    // console.log('获取authorization')
    var canonicalQueryString = this.getCanonicalQueryString(queryData)
    var canonicalHeaders = this.getCanonicalHeaders(headerData)
    var canonicalRequest = type + '\n' + canonicalQueryString + '\n' + canonicalHeaders
    // console.log(canonicalRequest)
    var key = ''
    if (skFlag) {
      key = this.option.key
    } else {
      key = this.sk
    }
    return CryptoJS.HmacSHA256(canonicalRequest, key)
  }

// ajax封装
  GosUpload.prototype.ajax = function(path, queryData, headerData, type, stsFlag, blob, proFun) {
    // console.log('进行ajax')
    var that = this
    var xhr = ''
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest()
    } else {
      /* eslint-disable */
      xhr = new ActiveXObject('Microsoft.XMLHTTP')
    }
    // 设置请求的类型及url
    // post请求一定要添加请求头才行不然会报错
    xhr.open(type, that.option.host + path + '?' + that.getCanonicalQueryString(queryData), that.option.ifAsync)
    xhr.setRequestHeader('Authorization', that.getAuthorization(queryData, headerData, type, stsFlag))
    for (var i in headerData) {
      if (i !== 'Content-Length' && i !== 'Content-Type') xhr.setRequestHeader(i, headerData[i])
    }
    var ajaxPromise = new Promise(function(resolve, reject) {
      xhr.onreadystatechange = function() {
        xhr.addEventListener('error', function(event) {
          reject(event)
        })
        // 这步为判断服务器是否正确响应
        if (xhr.readyState === 4 && xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText))
        }
      }
      if (blob) {
        xhr.upload.onprogress = proFun
        xhr.send(blob)
      } else {
        xhr.send()
      }
    })
    ajaxPromise.xhr = xhr
    return ajaxPromise
  }

// 获取sk
  GosUpload.prototype.sts = function() {
    var date = new Date().toISOString()
    var queryData = {
      bucket: this.option.bucketName,
      inseconds: this.option.inseconds
    }
    var headerDate = {
      'X-Gos-Date': date
    }
    return this.ajax(this.option.stsPath, queryData, headerDate, 'GET', true)
  }

// 单文件上传
  GosUpload.prototype.upload = function(blob) {
    var that = this
    return that.sts().then(function(res) {
      var date = new Date().toISOString()
      if (res.retCode === 0) {
        that.ak = res.data.ak
        that.sk = res.data.sk
        var queryData = {
          ak: that.ak,
          key: that.option.bucketPath + '/' + blob.name
        }
        var headerData = {
          'Content-Length': String(blob.size),
          'Content-MD5': '1111',
          'X-Gos-Date': date
        }
        /* eslint-disable */
        function proFun(evt) {
          if (evt.lengthComputable) {
            var loading = Math.round(evt.loaded / evt.total * 100)
            blob.process = loading
            that.option.uploadProgress(evt, blob, blob.process)
          }
        }
        var ajax = that.ajax(that.option.uploadPath, queryData, headerData, 'PUT', false, blob, proFun)
        blob.process = 0
        blob.xhrArr = [ajax.xhr]
        that.option.beforeUpload(blob)
        return ajax.then(function(res) {
          if (res.retCode === 0) {
            blob.ignore = true
            that.option.fileUploaded(blob, res.data, res)
            return Promise.resolve(res)
          } else {
            that.option.error(res)
            return Promise.reject(res)
          }
        })
      } else {
        return Promise.reject(res)
      }
    }).catch(function(res) {
      return Promise.reject(res)
    })
  }

// 分片上传初始化
  GosUpload.prototype.upload2Init = function(blob) {
    var that = this
    return this.sts().then(function(res) {
      var date = new Date().toISOString()
      if (res.retCode === 0) {
        that.ak = res.data.ak
        that.sk = res.data.sk
        var queryData = {
          ak: that.ak,
          key: that.option.bucketPath + '/' + blob.name
        }
        var headerData = {
          'X-Gos-Date': date
        }
        return that.ajax(that.option.initPart, queryData, headerData, 'GET')
      } else {
        return Promise.reject(res.retMsg)
      }
    })
  }

// 单分上传
  GosUpload.prototype.upload2Part = function(blob, sblob, partNumber) {
    var that = this
    var date = new Date().toISOString()
    var queryData = {
      ak: that.ak,
      key: that.option.bucketPath + '/' + sblob.name,
      uploadId: sblob.uploadId,
      partNumber: String(partNumber)
    }
    var headerData = {
      'Content-Length': String(sblob.size),
      'Content-MD5': '1111',
      'X-Gos-Date': date
    }
    function proFun(evt) {
      if (evt.lengthComputable) {
        var loading = Math.round(evt.loaded / evt.total * 100)
        blob.process[partNumber - 1] = loading / blob.len
        that.option.uploadProgress(evt, blob, blob.process.reduce(function(a, b) { return a + b }))
      }
    }
    return that.ajax(that.option.uploadPart, queryData, headerData, 'PUT', false, sblob, proFun)
  }

// 完成上传
  GosUpload.prototype.upload2Comp = function(blob) {
    var date = new Date().toISOString()
    var queryData = {
      ak: this.ak,
      key: this.option.bucketPath + '/' + blob.name,
      uploadId: blob.uploadId
    }
    var headerData = {
      'X-Gos-Date': date
    }
    return this.ajax(this.option.compPart, queryData, headerData, 'GET')
  }

// 分片上传
  GosUpload.prototype.upload2 = function(blob) {
    var that = this
    var promiseArr = []
    var len = Math.ceil(blob.size / that.size)
    return this.upload2Init(blob).then(function(res) {
      if (res.retCode === 0) {
        blob.uploadId = res.data.UploadId
        blob.process = []
        blob.xhrArr = []
        blob.len = len
        that.option.beforeUpload(blob)
        // 分片上传
        for (var i = 0; i < len; i++) {
          var sblob = blob.slice(i * that.size, (i + 1) * that.size)
          sblob.uploadId = blob.uploadId
          sblob.name = blob.name
          var part = that.upload2Part(blob, sblob, i + 1)
          // 保存promise里的xhr，用于中断上传
          blob.xhrArr.push(part.xhr)
          promiseArr.push(part)
        }
        // 所有分片上传完成后调用成功接口
        return Promise.all(promiseArr).then(function(resArr) {
          // 任何分片错误返回错误
          for (var resIndex in resArr) {
            if (resArr[resIndex].retCode !== 0) {
              return Promise.reject(resArr[resIndex])
            }
          }
          // 所有分片成功请求完成接口
          return that.upload2Comp(blob).then(function(res) {
            if (res.retCode === 0) {
              blob.ignore = true
              that.option.fileUploaded(blob, res.data)
              return Promise.resolve(res)
            } else {
              return Promise.reject(res)
            }
          })
        }).catch(function(res) {
          return Promise.reject(res)
        })
      } else {
        return Promise.reject(res)
      }
    }).catch(function(res) {
      return Promise.reject(res)
    })
  }

// 终止上传
  GosUpload.prototype.upload2Abort = function(blob) {
    var date = new Date().toISOString()
    var queryData = {
      ak: this.ak,
      key: this.option.bucketPath + '/' + blob.name,
      uploadId: blob.uploadId
    }
    var headerData = {
      'X-Gos-Date': date
    }
    return this.ajax(this.option.abortPart, queryData, headerData, 'GET')
  }

  /**
   * @description 获取媒体信息
   * @param {String} url 媒体地址
   */
  GosUpload.prototype.getMediaMeta = function(url) {
    var that = this
    return new Promise(function(resolve, reject) {
      var xhr = ''
      if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest()
      } else {
        xhr = new ActiveXObject('Microsoft.XMLHTTP')
      }
      var formData = new FormData()
      formData.append('url', url)
      formData.append('timestamp', new Date().getTime())
      xhr.withCredentials = false
      xhr.open('POST', `${that.option.host}${that.option.getMediaMeta}`, false)
      xhr.onreadystatechange = function() {
        xhr.addEventListener('error', function(event) {
          reject(event)
        })
        // 这步为判断服务器是否正确响应
        if (xhr.readyState === 4 && xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject()
        }
      }
      xhr.send(formData)
    }).then(function(res) {
      if (res.retCode === 0) {
        return Promise.resolve(res)
      } else {
        return Promise.reject(res)
      }
    }).catch(function(res) {
      return Promise.reject(res)
    })
  }

  return{
    GosUpload: GosUpload
  }
})(window, document);
