// ссылка на блок веб-страницы, в котором будет отображаться графика
var container;

// переменные: камера, сцена и отрисовщик
var camera, scene, renderer;

var keyboard = new THREEx.KeyboardState();
var angle = Math.PI/2;

var chase = -1;

// создание массива планет    
var planets = [];

var clock = new THREE.Clock();

// функция инициализации камеры, отрисовщика, объектов сцены и т.д.
init();

// обновление данных по таймеру браузера
animate();

// в этой функции можно добавлять объекты и выполнять их первичную настройку
function init() 
{
    // получение ссылки на блок html-страницы
    container = document.getElementById('container');
    // создание сцены
    scene = new THREE.Scene();

    // установка параметров камеры
    // 45 - угол обзора
    // window.innerWidth / window.innerHeight - соотношение сторон
    // 1 и 4000 - ближняя и дальняя плоскости отсечения
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);    

    // установка позиции камеры
    camera.position.set(75, 110, 60);
    
    // установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3(0, 0, 0));  

    // создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize(window.innerWidth, window.innerHeight);
    // закрашивание экрана синим цветом, заданным в шестнадцатеричной системе
    renderer.setClearColor(0x000000ff, 1);

    container.appendChild(renderer.domElement);

    // добавление обработчика события изменения размеров окна
    window.addEventListener('resize', onWindowResize, false);

    const alight = new THREE.AmbientLight( 0x202020 ); // soft white light
    scene.add(alight);

    const light = new THREE.PointLight(0xFFFFFF);
    light.position.set(0,0,0);
    scene.add(light);

    addSphere(10, "planets/sunmap.jpg");
    addSphere(500, "planets/starmap.jpg");

    planets.push(addPlanet(2, "planets/mercury/mercurymap.jpg", "planets/mercury/mercurybump.jpg", 20, 0.1, 0.5, null));
    planets.push(addPlanet(3, "planets/venus/venusmap.jpg", "planets/venus/venusbump.jpg", 30, 0.5, 1, null));
    planets.push(addPlanet(4, "planets/earth/earthmap1k.jpg", "planets/earth/earthbump1k.jpg", 40, 1, 1.5, addPlanet(0.5, "planets/earth/moon/moonmap1k.jpg", "planets/earth/moon/moonbump1k.jpg", 6, 0.4, 0.6, null)));
    planets.push(addPlanet(2, "planets/mars/marsmap1k.jpg", "planets/mars/marsbump1k.jpg", 50, 1.5, 2, null));
}

function onWindowResize() 
{
    // изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // изменение соотношения сторон рендера
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// в этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate() 
{
    var delta = clock.getDelta();//возвращает время, прошедшее с момента предыдущего вызова этой функции

    keys(delta);
    
    // перебор планет
    for (var i = 0; i < planets.length; i++) 
    {
        // создание набора матриц
        var m = new THREE.Matrix4();
        var m1 = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();

        planets[i].a1 += planets[i].s1 * delta;
        planets[i].a2 += planets[i].s2 * delta;

        // создание матрицы поворота (вокруг оси Y) в m1 и матрицы перемещения в m2           
        m1.makeRotationY(planets[i].a1);
        m2.setPosition(new THREE.Vector3(planets[i].x, 0, 0));

        // запись результата перемножения m1 и m2 в m
        m.multiplyMatrices(m2, m1);

        m1.makeRotationY(planets[i].a2);

        m.multiplyMatrices(m1, m);

        // установка m в качестве матрицы преобразований объекта object            
        planets[i].sphere.matrix = m;
        planets[i].sphere.matrixAutoUpdate = false;

        if (planets[i].sat != null)
        {
            // создание набора матриц
            var sm = new THREE.Matrix4();
            var sm1 = new THREE.Matrix4();
            var sm2 = new THREE.Matrix4();

            planets[i].sat.a1 += planets[i].sat.s1 * delta;
            planets[i].sat.a2 += planets[i].sat.s2 * delta;

            // создание матрицы поворота (вокруг оси Y) в m1 и матрицы перемещения в m2           
            sm1.makeRotationY(planets[i].sat.a1);
            sm2.setPosition(new THREE.Vector3(planets[i].sat.x, 0, 0));

            // запись результата перемножения m1 и m2 в m
            sm.multiplyMatrices(sm2, sm1);

            sm1.makeRotationY(planets[i].sat.a2);

            sm.multiplyMatrices(sm1, sm);

            // получение матрицы позиции из матрицы объекта 
            var mm = new THREE.Matrix4();
            mm.copyPosition(m);

            // получение позиции из матрицы позиции
            var pos = new THREE.Vector3(0, 0, 0);
            pos.setFromMatrixPosition(mm);

            sm2.setPosition(pos);

            sm.multiplyMatrices(sm2, sm);

            // установка m в качестве матрицы преобразований объекта object            
            planets[i].sat.sphere.matrix = sm;
            planets[i].sat.sphere.matrixAutoUpdate = false;

            planets[i].sat.tr.position.copy(pos);
        }
    }
    
    // добавление функции на вызов при перерисовке браузером страницы 
    requestAnimationFrame(animate);

    render();   
}

function render() 
{
    // рисование кадра
    renderer.render(scene, camera);
}

function addSphere(r, tname)
{
    // создание геометрии для сферы	
    var geometry = new THREE.SphereGeometry(r, 32, 32);

    // загрузка текстуры
    var tex = new THREE.TextureLoader().load(tname);
    tex.minFilter = THREE.NearestFilter;

    // создание материала
    var material = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide
    });

    // создание объекта
    var sphere = new THREE.Mesh(geometry, material);

    // размещение объекта в сцене
    scene.add(sphere);
}

function addPlanet(r, tname, bname, x, s1, s2, sat)
{
    // создание геометрии для сферы	
    var geometry = new THREE.SphereGeometry(r, 32, 32);

    // загрузка текстуры
    var tex = new THREE.TextureLoader().load(tname);
    tex.minFilter = THREE.NearestFilter;

    // загрузка карты рельефа
    var bump = new THREE.TextureLoader().load(bname);

    // создание материала
    var material = new THREE.MeshPhongMaterial({
        map: tex,
        bumpMap: bump,
        bumpScale: 0.5,
        side: THREE.DoubleSide
    });

    // создание объекта
    var sphere = new THREE.Mesh(geometry, material);

    sphere.position.x = x;
    
    // размещение объекта в сцене
    scene.add(sphere);

    // создание объекта планеты
    var planet = {};
    // добавление поля для хранения сферы
    planet.sphere = sphere;   
    planet.x = x;
    planet.r = r;
    planet.s1 = s1;
    planet.a1 = 0.0;
    planet.s2 = s2;
    planet.a2 = 0.0;
    planet.sat = sat;
    planet.tr = traj(x);

    return planet;
}
//пунктирные линии
function traj(r)
{
    var lineGeometry = new THREE.Geometry();
    var vertices = lineGeometry.vertices;

    for (var i = 0; i < 360; i++)
    {
        var x = r * Math.cos(i * Math.PI/180);
        var z = r * Math.sin(i * Math.PI/180);
        // начало сегмента линии
        vertices.push(new THREE.Vector3(x, 0, z));
    }
    // конец сегмента линии
    //vertices.push(new THREE.Vector3(x2, y2, z2));
        
    // параметры: цвет, размер черты, размер промежутка
    var lineMaterial = new THREE.LineDashedMaterial({
        color: 0xffff00,
        dashSize: 0.5,
        gapSize: 3
    });

    var line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    scene.add(line);

    return line;
}
//клавиатура
function keys(delta)
{
    if (keyboard.pressed("0")) 
    {
        chase = -1;
    }
    if (keyboard.pressed("1")) 
    {
        chase = 0;
    }
    
    if (keyboard.pressed("2")) 
    {
        chase = 1;
    }
    if (keyboard.pressed("3")) 
    {
        chase = 2;
    }
    if (keyboard.pressed("4")) 
    {
        chase = 3;
    }

    if (chase > -1)
    {
        // получение матрицы позиции из матрицы объекта 
        var mm = new THREE.Matrix4();
        mm.copyPosition(planets[chase].sphere.matrix);

        // получение позиции из матрицы позиции
        var pos = new THREE.Vector3(0, 0, 0);
        pos.setFromMatrixPosition(mm);

        var x = pos.x + planets[chase].r*4 * Math.cos(angle - planets[chase].a2); 
        var z = pos.z + planets[chase].r*4 * Math.sin(angle - planets[chase].a2);

        // установка позиции камеры
        camera.position.set(x, 0, z);
        
        // установка точки, на которую камера будет смотреть
        camera.lookAt(pos);
    } else
    {
        // установка позиции камеры
        camera.position.set(75, 110, 60);
        
        // установка точки, на которую камера будет смотреть
        camera.lookAt(new THREE.Vector3(0, 0, 0));  
    }
}