
const G = 6.67 * (10 ^ -11);
// const interval = 1000;
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
        this.createObj();
    }
    createObj() {

        var geometry = new THREE.SphereGeometry(this.size, this.size, this.size);
        var material = new THREE.MeshBasicMaterial({ color: this.color });
        var obj = new THREE.Mesh(geometry, material);

        this.obj = obj;
        Object.assign(this.obj.position, this.site);
    }
    //单位时间位移
    moveDiv() {
        //计算加速度
        let accelerate = this.force.div(this.quality);  //a = f/m
        //速度 = 速度 + 加速度/dt
        this.speed = this.speed.vadd(accelerate);

        //位置 = 位置 + 速度/dt
        this.site = this.site.vadd(this.speed);
        // console.log("天体" + this.name + "位置:", this.obj.position);
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
            let r = this.site.vsub(others[i].site); //destination - origin
            let forceValue = G * (this.quality * others[i].quality) / r.square();
            let force = r.mul(forceValue);
            allForces = allForces.vadd(force);
        }
        this.force = allForces;


        //若发生碰撞，则天体不移动
        let ret = this.checkCollision(others);
        if (ret != null) {
            //若发生碰撞，不分析受力情况，天体不一定
            this.speed = new Vector(0, 0, 0);
            this.force = new Vector(0, 0, 0)
            // this.force = this.force.div(4);
            return;
        }
    }

    render() {
        Object.assign(this.obj.position, this.site);
        this.obj.rotation.y += 0.01;
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
        //计算进程
        //更新所有天体状态
        this.bodys.forEach(body => {
            body.calculateForce(this.bodys);  //计算天体合外力
            body.moveDiv();             //更新天体状态
        })

        this.bodys.forEach(body => {
            body.render()
        })

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    mouseControl() {
        let camera = this.camera;
        var startX, endX, startY, endY;
        var isDown = false;
        document.onmousedown = function (event) {
            startX = event.clientX;
            startY = event.clientY;
            isDown = true;
        };
        document.onmouseup = function (event) {
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
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,   // 抗锯齿
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.bodys.forEach(body => {
            this.scene.add(body.obj);
        })

        this.camera.position.z = 500;
        this.renderer.render(this.scene, this.camera);
        this.mouseControl();
    }

    start() {
        //绘画进程
        requestAnimationFrame(this.render.bind(this));
    }
}


// main
// 创建宇宙
let body1 = new Body("天体-1", new Vector(100, 0, 0), 2, new Vector(1, 3, 0), 0xff0000);
let body2 = new Body("天体-2", new Vector(100, 100, 0), 5, new Vector(2, 0, 0), 0x00ff00);
let body3 = new Body("天体-3", new Vector(0, 0, 100), 4, new Vector(2, 0, 0), 0x0000ff);

//创建宇宙
let universe1 = new Universe(new Array(body1, body2, body3));
universe1.init();
universe1.start();