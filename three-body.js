
const G = 6.67 * (10 ** 0);
const interval = 10;
let gameover = false;
// const refresh = 1000;
//向量
class Vector {
    x = 0;
    y = 0;
    z = 0;
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    vadd(vector) {
        let x = this.x + vector.x;
        let y = this.y + vector.y;
        let z = this.z + vector.z;
        return new Vector(x, y, z);
    }
    vsub(vector) {
        let x = this.x - vector.x;
        let y = this.y - vector.y;
        let z = this.z - vector.z;
        return new Vector(x, y, z);
    }
    div(num) {
        let x = this.x / num;
        let y = this.y / num;
        let z = this.z / num;
        return new Vector(x, y, z);
    }

    mul(num) {
        let x = this.x * num;
        let y = this.y * num;
        let z = this.z * num;
        return new Vector(x, y, z);
    }
    inverse() {
        return new Vector(-this.x, -this.y, -this.z);
    }

    normalize() {
        let mod = (this.x * this.x + this.y * this.y + this.z * this.z) ** 0.5;
        return this.div(mod);
    }

    square() {
        let x = this.x * this.x;
        let y = this.y * this.y;
        let z = this.z * this.z;
        return x + y + z;
    }

    string() {
        return "x:" + this.x + ", y:" + this.y + ", z:" + this.z;
    }
}

//天体
class Body {
    force = new Vector(0, 0, 0);      //天体所受合外力
    constructor(name, site, quality, speed, color) {
        this.name = name;
        this.site = site;
        this.size = quality;
        this.quality = quality;
        this.speed = speed;
        this.color = color;
        this.lineBuf = [];
        this.createObj();
        this.createLine();
    }

    //创建星球体
    createObj() {
        var geometry = new THREE.SphereGeometry(this.size, this.size, this.size);
        var material = new THREE.MeshBasicMaterial({ color: this.color });
        var obj = new THREE.Mesh(geometry, material);

        this.obj = obj;
        Object.assign(this.obj.position, this.site);
    }

    //运行轨迹
    createLine() {
        let _material = new THREE.LineBasicMaterial({
            color: this.color
        });
        this.lineGeometry = new THREE.BufferGeometry();
        var _vertices = new Float32Array(this.lineBuf);
        this.lineGeometry.addAttribute('position', new THREE.BufferAttribute(_vertices, 3));
        this.line = new THREE.Line(this.lineGeometry, _material);
    }

    //单位时间位移
    moveDiv() {
        //计算加速度
        let accelerate = this.force.div(this.quality);  //a = f/m
        //速度 = 速度 + 加速度/dt
        this.speed = this.speed.vadd(accelerate);

        //位置 = 位置 + 速度/dt
        this.site = this.site.vadd(this.speed);
        // if (this.name == "天体-1")
        // console.log("天体" + this.name + "位置:", this.obj.position, "受力:", this.force);
        console.log("天体" + this.name + "位置:", this.obj.position, "受力:", this.force);
    }

    //碰撞检查
    checkCollision(others) {
        for (let i = 0; i < others.length; i++) {
            //排除自己
            if (others[i] == this) {
                continue;
            }
            //获取距离
            let distanceSquare = this.site.vsub(others[i].site).square();
            let border = (this.size + others[i].size);
            // console.log("distance:", distanceSquare, ", border:", border * border);
            if (distanceSquare <= border * border) {
                return others[i];
            }
        }
        return null;
    }

    //计算单位时间合外力
    calculateForce(others) {
        let allForces = new Vector(0, 0, 0);

        for (let i = 0; i < others.length; i++) {
            //排除自己
            if (others[i] == this) {
                continue;
            }
            //万有引力
            // F = G * ((M * m) / r^2)
            let r = others[i].site.vsub(this.site); //destination - origin
            let forceValue = G * (this.quality * others[i].quality) / r.square();
            let force = r.normalize().mul(forceValue);  //合外力=力的方向*力的值
            allForces = allForces.vadd(force);
        }
        this.force = allForces;


        //若发生碰撞，则天体不移动
        let ret = this.checkCollision(others);
        if (ret != null) {
            //若发生碰撞，不分析受力情况，天体不一定
            this.speed = new Vector(0, 0, 0);
            this.force = new Vector(0, 0, 0);
            // this.force = this.force.div(4);
            if (!gameover) {
                alert("发生了碰撞");
                gameover = true;
            }
            return;
        }
    }

    render() {
        if (gameover) {
            return;
        }
        Object.assign(this.obj.position, this.site);
        this.obj.rotation.y += 0.01;

        //轨迹
        if (this.lineBuf.length > 500 * 3) {
            this.lineBuf.shift();
            this.lineBuf.shift();
            this.lineBuf.shift();
        }
        if (this.name == "天体-1")
            console.log(this.lineBuf)
        this.lineBuf.push(this.site.x, this.site.y, this.site.z)
        let _vertices = new Float32Array(this.lineBuf)
        this.lineGeometry.addAttribute('position', new THREE.BufferAttribute(_vertices, 3));
    }
}

class Universe {
    constructor(bodys) {
        this.bodys = bodys;
    }
    addBody(body) {
        this.bodys = this.bodys.concat(body);
    }

    render(timestamp) {
        this.bodys.forEach(body => {
            body.render();
        })

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    // autoCamera() {
    //     let result = new Vector(0, 0, 0);
    //     this.bodys.forEach(body => {
    //         result = result.vadd(body.site);
    //     });
    //     result = result.div(3);
    // }

    mouseControl() {
        let camera = this.camera;
        var startX, endX, startY, endY;
        var isDown = false;
        document.onmousedown = function (event) {
            startX = event.clientX;
            startY = event.clientY;
            isDown = true;
        };
        document.onmouseup = function () {
            isDown = false;
        };
        document.onmousemove = function (event) {
            if (isDown) {
                endX = event.clientX;
                endY = event.clientY;
                var x = endX - startX;
                var y = endY - startY;
                if (Math.abs(x) > Math.abs(y)) {
                    camera.position.x = camera.position.x - x * 0.25;
                } else {
                    camera.position.y = camera.position.y + y * 0.25;
                }
                startX = endX;
                startY = endY;
            }
        };
        document.onmousewheel = function (event) {
            if (event.deltaY > 0) {
                camera.position.z = camera.position.z + 20;
            } else if (event.deltaY < 0) {
                camera.position.z = camera.position.z - 20;
            }
        }
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,   // 抗锯齿
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.bodys.forEach(body => {
            this.scene.add(body.obj);
            this.scene.add(body.line);
        })

        this.camera.position.z = 500;
        this.renderer.render(this.scene, this.camera);
        this.mouseControl();
    }

    start() {
        setInterval(() => {
            //计算进程
            //更新所有天体状态
            this.bodys.forEach(body => {
                body.calculateForce(this.bodys);  //计算天体合外力
                body.moveDiv();             //更新天体状态
            })

        }, 10)
        //绘画进程
        requestAnimationFrame(this.render.bind(this));
    }
}


// main
// 创建宇宙
let body1 = new Body("天体-1", new Vector(-150, 0, 0), 10, new Vector(0, 0.4, 0), 0xf64024);
let body2 = new Body("天体-2", new Vector(150, 0, 0), 10, new Vector(0, -0.6, 0), 0xe65f09);
let body3 = new Body("天体-3", new Vector(40, 20, 20), 5, new Vector(-0.4, 0, -0.5), 0x440bfc);

//创建宇宙
let universe1 = new Universe(new Array(body1, body2, body3));
universe1.init();
universe1.start();