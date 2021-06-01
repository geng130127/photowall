utility = (function () {
  'use strict';
  /**
   * 函数防抖
   * @param func 要执行的函数
   * @param wait 等待时间
   * @param immediate ture: 在 wait 时间间隔的开始调用这个函数
   */
  const debounce = function(func, wait, immediate = false) {
    let timeout, args, context, timestamp, result
    const later = function() {
      // 据上一次触发时间间隔
      const last = new Date() - timestamp
      // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last)
      } else {
        timeout = null
        // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
        if (!immediate) {
          result = func.apply(context, args)
          if (!timeout) context = args = null
        }
      }
    }

    return function() {
      context = this
      args = arguments
      timestamp = new Date()
      const callNow = immediate && !timeout
      // 如果延时不存在，重新设定延时
      if (!timeout) timeout = setTimeout(later, wait)
      if (callNow) {
        result = func.apply(context, args)
        context = args = null
      }

      return result
    }
  }

  /**
   * 函数节流
   * @param func 要执行的函数
   * @param wait 等待时间
   * @param options {leading:true|false ||  trailin:true|falseg}
   * @return {function(): *}
   */
  const throttle = function(func, wait, options) {
    // 上下文，函数参数，函数返回值
    let context, args, result
    // 延时器
    let timeout = null
    // 上一次执行的func的时间点
    let previous = 0
    if (!options) options = {}
    // 延时执行函数
    const later = function() {
      // 如果及时调用被关闭，则设置previous为0
      previous = options.leading === false ? 0 : new Date()
      timeout = null
      result = func.apply(context, args)
      if (!timeout) context = args = null
    }
    /** 以上变量以及函数都是通过闭包的方式访问的 **/
    return function() {
      const now = new Date()
      if (!previous && options.leading === false) previous = now
      // remaining容易理解，表示还剩多少时间可以再次执行func
      const remaining = wait - (now - previous)
      // 保存上下文
      context = this
      // 获取函数参数
      args = arguments
      // 及时模式
      // remaining小于等于0是跳出wait的限制，可以执行了
      // remaining大于wait的情况，只有在客户机修改了系统时间的时候才会出现
      // 这两种情况都可以立刻对func做调用
      if (remaining <= 0 || remaining > wait) {
        // 清除定时器
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        previous = now
        result = func.apply(context, args)
        if (!timeout) context = args = null
      } else if (!timeout && options.trailing !== false) { // 延时模式
        timeout = setTimeout(later, remaining)
      }
      return result
    }
  }
  /**
   * 格式化时间戳
   * @param time 时间戳
   * @param cFormat 格式
   * @return {string|null}
   */
  const formatDate = function(time, cFormat) {
    if (arguments.length === 0) {
      return null
    }
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
    let date
    if (typeof time === 'object') {
      date = time
    } else {
      if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
        time = parseInt(time)
      }
      if ((typeof time === 'number') && (time.toString().length === 10)) {
        time = time * 1000
      }
      date = new Date(time)
    }
    const formatObj = {
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      i: date.getMinutes(),
      s: date.getSeconds(),
      a: date.getDay()
    }
    const time_str = format.replace(/{([ymdhisa])+}/g, (result, key) => {
      const value = formatObj[key]
      // Note: getDay() returns 0 on Sunday
      if (key === 'a') {
        return ['日', '一', '二', '三', '四', '五', '六'][value]
      }
      return value.toString().padStart(2, '0')
    })
    return time_str
  }

  /**
   * 时间的间隔，最小以分钟为单位
   * @param time
   * @param option
   */
  const timeBetween = function(time, option) {
    if (('' + time).length === 10) {
      time = parseInt(time) * 1000
    } else {
      time = +time
    }
    const d = new Date(time)
    const now = Date.now()

    const diff = (now - d) / 1000

    if (diff < 30) {
      return '刚刚'
    } else if (diff < 3600) {
      // less 1 hour
      return Math.ceil(diff / 60) + '分钟前'
    } else if (diff < 3600 * 24) {
      return Math.ceil(diff / 3600) + '小时前'
    } else if (diff < 3600 * 24 * 2) {
      return '1天前'
    }
    if (option) {
      return formatDate(time, option)
    } else {
      return (
        d.getMonth() +
        1 +
        '月' +
        d.getDate() +
        '日' +
        d.getHours() +
        '时' +
        d.getMinutes() +
        '分'
      )
    }
  }

  /**
   * 生成uuid
   * @returns {String}
   */
  const uuid = function() {
    var temp_url = URL.createObjectURL(new Blob())
    var uuid = temp_url.toString()
    URL.revokeObjectURL(temp_url)
    return uuid.substr(uuid.lastIndexOf('/') + 1)
  }

  /**
   * 重命名文件名
   * @param File 文件对象
   * @param type 文件类型
   */
  const fileRename = function(File, type) {
    try {
      const lastIndexSplit = File.name.lastIndexOf('.')
      if (lastIndexSplit === -1) {
        return null
      }
      const suffix = File.name.substr(lastIndexSplit + 1)
      const fileName = `${uuid()}.${suffix}`
      return new window.File([File], fileName, { type: type })
    } catch {
      return null
    }
  }

  /**
   * 图片转base64
   * @param file 图片
   * @param callback 回调函数
   */
  const fileByBase64 = function (file,callback) {
    let reader = new FileReader();
    // 传入一个参数对象即可得到基于该参数对象的文本内容
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      // target.result 该属性表示目标对象的DataURL
      callback(e.target.result)
    };
  }

  // 获取图片的高度
  const loadImgHeights = function (imgs) {
    // 屏幕真实宽度
    const windowWidth = $(window).width() > 750 ? 750 : $(window).width()
    // 页面内边距
    const paddingWidth = (Number($('.container').css('paddingLeft').replace('px', '')) * 2)
    // 列之间的间距
    const imageLeftMargin = $('.container .column-container .card-items.left').css('marginRight').replace('px', '')
    // 两列图片的总宽度
    const docWidth = windowWidth-paddingWidth-imageLeftMargin
    // 卡牌中的信息高度
    const cardInfoHeight = Number($('html').css('fontSize').replace('px', '')) * 1.75
    const halfBodyWidth = docWidth / 2

    return new Promise((resolve, reject) => {
      const length = imgs.length
      const heights = []
      let count = 0
      const load = (index, img_src) => {
        let img = new Image()
        const checkIfFinished = () => {
          count++
          if (count === length) {
            resolve(heights)
          }
        }
        const scr_api = img_src.split('?')[0]
        $.ajax({
          type: 'GET',
          url: `${scr_api}?imageInfo`,
          datatype: 'json',
          success: function (data) {
            const ratio = data.height / data.width
            // 高度按屏幕一半的比例来计算
            // heights[index] = ratio * ($(window).width() / 2)
            heights[index] = (ratio * halfBodyWidth) + cardInfoHeight
            checkIfFinished()
          },
          error: function (XMLHttpRequest, textStatus, errorThrown) {
            heights[index] = 0
            checkIfFinished()
          }
        })
      }
      // imgs.forEach((img_src, index) => load(index, img_src))
      imgs.forEach((img_item, index) => load(index, img_item.image_link))
    })
  }
  // 尽可能选出图片中高度最接近图片总高度一半的元素
  const sum = (nums) => nums.reduce((a, b) => a + b, 0)
  const omitByIndexes = (arr, omitIndexes) => {
    let res = []
    for (let i = 0; i < arr.length; i++) {
      if (!omitIndexes.includes(i)) {
        res.push(i)
      }
    }
    return res
  }
  const dpHalf = (heights) => {
    let mid = Math.round(sum(heights) / 2)
    let dp = []

    // 基础状态 只考虑第一个图片的情况
    dp[0] = []
    for (let cap = 0; cap <= mid; cap++) {
      dp[0][cap] = heights[0] > cap ? { max: 0, indexes: [] } : { max: heights[0], indexes: [0] }
    }

    for (let useHeightIndex = 1; useHeightIndex < heights.length; useHeightIndex++) {
      if (!dp[useHeightIndex]) {
        dp[useHeightIndex] = []
      }
      for (let cap = 0; cap <= mid; cap++) {
        let usePrevHeightDp = dp[useHeightIndex - 1][cap]
        let usePrevHeightMax = usePrevHeightDp.max
        let currentHeight = heights[useHeightIndex]
        // 这里有个小坑 剩余高度一定要转化为整数 否则去dp数组里取到的就是undefined了
        let useThisHeightRestCap = Math.round(cap - heights[useHeightIndex])
        let useThisHeightPrevDp = dp[useHeightIndex - 1][useThisHeightRestCap]
        let useThisHeightMax = useThisHeightPrevDp ? currentHeight + useThisHeightPrevDp.max : 0

        // 是否把当前图片纳入选择 如果取当前的图片大于不取当前图片的高度
        if (useThisHeightMax > usePrevHeightMax) {
          dp[useHeightIndex][cap] = {
            max: useThisHeightMax,
            indexes: useThisHeightPrevDp.indexes.concat(useHeightIndex),
          }
        } else {
          dp[useHeightIndex][cap] = {
            max: usePrevHeightMax,
            indexes: usePrevHeightDp.indexes,
          }
        }
      }
    }

    return dp[heights.length - 1][mid]
  }
  const greedy = (heights) => {
    let leftHeight = 0
    let rightHeight = 0
    let left = []
    let right = []

    heights.forEach((height, index) => {
      if (leftHeight >= rightHeight) {
        right.push(index)
        rightHeight += height
      } else {
        left.push(index)
        leftHeight += height
      }
    })

    return { left, right }
  }
  // 获取左边高度或者右边高度
  const getColumnPosition = function () {
    let leftHeight = $('.column-container .card-items.left').height()
    let rightHeight = $('.column-container .card-items.right').height()
    if(leftHeight > rightHeight){
      return 'right'
    }
    return 'left'
  }
  return {
    throttle: throttle,
    debounce: debounce,
    formatDate: formatDate,
    timeBetween: timeBetween,
    fileRename: fileRename,
    fileByBase64: fileByBase64,
    loadImgHeights: loadImgHeights,
    omitByIndexes: omitByIndexes,
    dpHalf: dpHalf,
    greedy: greedy,
    getColumnPosition: getColumnPosition
  }
})();
