let w_width = 1024
let w_height = 768
let radius = 8
let margin_top = 60
let margin_left = 30
let endTime = new Date()
endTime.setTime(endTime.getTime() + 3600 * 1000 * 24)
let cursShowTimeSeconds = 0
const ball_colors = ['#F6FF33', '#96FF33', '#3393FF', '#DD33FF', '#FF3361', '#8D33FF', '#33FFE6', '#FF4633', '#BA4A00', '#D5F5E3']
const balls = []

/**
 * 绘制数字
 * @param x 轴距位置X
 * @param y 轴距位置Y
 * @param num 绘制的具体数字
 * @param ctx context对象
 */
const renderDigit = function (x, y, num, ctx) {
    ctx.fillStyle = 'rgb(19,128,240)'

    for (let i = 0; i < digit[num].length; i++) {
        let digitItem = digit[num][i]
        for (let j = 0; j < digitItem.length; j++) {
            if (digitItem[j]) {
                ctx.beginPath()
                // 画圆
                ctx.arc(x + j * 2 * (radius + 1) + (radius + 1), y + i * 2 * (radius + 1) + (radius + 1), radius, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill()
            }
        }
    }
}

const render = function (ctx) {

    // 刷新操作
    ctx.clearRect(0, 0, w_width, w_height)

    const hours = parseInt(cursShowTimeSeconds / 3600)
    const minutes = parseInt((cursShowTimeSeconds - hours * 3600) / 60)
    const seconds = cursShowTimeSeconds % 60

    renderDigit(margin_left, margin_top, parseInt(hours / 10), ctx)
    renderDigit(margin_left + 15 * (radius + 1), margin_top, parseInt(hours % 10), ctx)
    renderDigit(margin_left + 30 * (radius + 1), margin_top, 10, ctx)
    renderDigit(margin_left + 39 * (radius + 1), margin_top, parseInt(minutes / 10), ctx)
    renderDigit(margin_left + 54 * (radius + 1), margin_top, parseInt(minutes % 10), ctx)
    renderDigit(margin_left + 69 * (radius + 1), margin_top, 10, ctx)
    renderDigit(margin_left + 78 * (radius + 1), margin_top, parseInt(seconds / 10), ctx)
    renderDigit(margin_left + 93 * (radius + 1), margin_top, parseInt(seconds % 10), ctx)

    for (let i = 0; i < balls.length; i++) {
        ctx.fillStyle = balls[i].color
        ctx.beginPath()
        ctx.arc(balls[i].x, balls[i].y, radius, 0, 2 * Math.PI, true)
        ctx.closePath()
        ctx.fill()
    }
}

const addBalls = function (x, y, num) {
    for (let i = 0; i < digit[num].length; i++) {
        let digitItem = digit[num][i]
        for (let j = 0; j < digitItem.length; j++) {
            if (digitItem[j]) {
                let ball = {
                    x: x + j * 2 * (radius + 1) + (radius + 1),
                    y: y + i * 2 * (radius + 1) + (radius + 1),
                    g: 1.5 + Math.random(),
                    vx: Math.pow(-1, Math.ceil(Math.random() * 1000)) * 4,
                    vy: -5,
                    color: ball_colors[Math.floor(Math.random() * ball_colors.length)]
                }
                balls.push(ball)
            }
        }
    }
}

const updateBalls = function () {
    for (let i = 0; i < balls.length; i++) {
        balls[i].x += balls[i].vx
        balls[i].y += balls[i].vy
        balls[i].vy += balls[i].g
        if (balls[i].y >= w_height - radius) {
            balls[i].y = w_height - radius
            balls[i].vy = -balls[i].vy * 0.75
        }
    }
    let cnt = 0
    for (let i = 0; i < balls.length; i++) {
        if (balls[i].x + radius > 0 && balls[i].x - radius < w_width) {
            balls[cnt++] = balls[i]
        }
    }
    while (balls.length > Math.min(300, cnt)) {
        balls.pop()
    }
}

const update = function () {
    let nextShowTimeSeconds = getCursShowTimeSeconds()
    const nextHours = Number(nextShowTimeSeconds / 3600)
    const nextMinutes = Number((nextShowTimeSeconds - nextHours * 3600) / 60)
    const nextSeconds = nextShowTimeSeconds % 60

    const cursHours = Number(cursShowTimeSeconds / 3600)
    const cursMinutes = Number((cursShowTimeSeconds - cursHours * 3600) / 60)
    const cursSeconds = cursShowTimeSeconds % 60

    updateBalls()

    if (nextSeconds === cursSeconds) {
        return false
    }
    // 生成小球
    if (parseInt(cursHours / 10) != parseInt(nextHours / 10)) {
        addBalls(margin_left, margin_top, parseInt(cursHours / 10))
    }
    if (parseInt(cursHours % 10) != parseInt(nextHours % 10)) {
        addBalls(margin_left + 15 * (radius + 1), margin_top, parseInt(cursHours % 10))
    }
    if (parseInt(cursMinutes / 10) != parseInt(nextMinutes / 10)) {
        addBalls(margin_left + 39 * (radius + 1), margin_top, parseInt(cursMinutes / 10))
    }
    if (parseInt(cursMinutes % 10) != parseInt(nextMinutes % 10)) {
        addBalls(margin_left + 54 * (radius + 1), margin_top, parseInt(cursMinutes % 10))
    }
    if (parseInt(cursSeconds / 10) != parseInt(nextSeconds / 10)) {
        addBalls(margin_left + 78 * (radius + 1), margin_top, parseInt(cursSeconds / 10))
    }
    if (parseInt(cursSeconds % 10) != parseInt(nextSeconds % 10)) {
        addBalls(margin_left + 93 * (radius + 1), margin_top, parseInt(cursSeconds % 10))
    }
    cursShowTimeSeconds = nextShowTimeSeconds
}

const getCursShowTimeSeconds = function () {
    let curTime = new Date()
    let ret = endTime.getTime() - curTime.getTime()
    ret = Math.round(ret / 1000)
    return ret || 0
}

$(function () {
    w_width = $('body').width()
    w_height =  $('body').height()
    margin_left = Math.round(w_width / 10)
    radius =  Math.round(w_width * 4 / 5 / 108) - 1
    margin_top = Math.round(w_height / 5)
    const canvas = document.getElementById('canvas')
    canvas.width = w_width
    canvas.height = w_height
    const ctx = canvas.getContext('2d')
    cursShowTimeSeconds = getCursShowTimeSeconds()
    setInterval(() => {
        render(ctx)
        update()
    }, 50)
})
