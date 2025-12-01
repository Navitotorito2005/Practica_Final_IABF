let clients = [];
let map = null;

$(document).ready(function () {

    //* Cargar mapa con la posición de los clientes.
    map = L.map("map-container");
    CreateMap(JSON.parse(localStorage.getItem("pf-clients")) || []);

    //& Cambiar el tema de la página.
    $(document).on("change", "#chk-theme", function () {

        $("html").attr("data-bs-theme", $(this).prop("checked") ? "dark" : "light");
        localStorage.setItem("pf-theme", $("html").attr("data-bs-theme"));

    });

    //& Seleccionar un cliente al hacerle clic.
    $(document).on("click", ".client-item", function () {

        $(this).toggleClass("selected");
        if ($(this).hasClass("selected")) {

            //* Agregar cliente a la lista de seleccionados.
            const selNum = $(this).children(".client-selnum");
            const json = JSON.parse($(this).attr("data-client"));
            const id = clients.length + 1;

            selNum.show();
            selNum.text(id);
            clients.push(json);

        } else {

            //* Eliminar cliente de la lista y actualizar los números de los demás clientes.
            const selNum = $(this).children(".client-selnum");
            const id = Number(selNum.text()) - 1;

            selNum.hide();
            clients.splice(id, 1);

            $(".client-item.selected .client-selnum").each(function () {

                const currentId = Number($(this).text()) - 1;
                if (currentId > id) {
                    $(this).text(currentId);
                }

            });

        }

        //* Dibujar la ruta entre los clientes seleccionados.
        DrawRoute(clients);

    });

    //& Agregar un nuevo cliente.
    $(document).on("submit", "#form-client", function (e) {

        e.preventDefault();

        //* Guardar los datos del formulario.
        const name = $("#client-name").val();
        const desc = $("#client-desc").val();
        const zone = $("#client-zone").val();
        const lat = $("#client-lat").val();
        const lng = $("#client-lng").val();

        //* Crear el elemento HTML del cliente.
        const clientItem = $(`
            <div class="client-item mt-3 p-3 border border-1 rounded-3" data-client='{"name":"${name}","lat":"${lat}","lng":"${lng}"}'>
                <span class="client-selnum badge bg-success rounded-pill font-3 float-end" style="display: none;"> 0 </span>
                <p class="text-bold font-4 mb-0"> ${name} </p>
                <p class="text-muted font-2 mb-0"> ${desc} </p>
                <span class="badge bg-secondary rounded-pill mt-2"> ${zone} </span>
            </div>
        `);
        $("#client-list").append(clientItem);

        //* Agregar cliente al localStorage.
        let storedClients = JSON.parse(localStorage.getItem("pf-clients")) || [];
        storedClients.push({ name, desc, zone, lat, lng });
        localStorage.setItem("pf-clients", JSON.stringify(storedClients));

        //* Resetear el formulario y cerrar el modal.
        $("#form-client")[0].reset();
        $("#modal-addClient").modal("hide");

        //* Actualizar el mapa con la nueva ubicación.
        CreateMap(storedClients);

    });

    //& Limpiar clientes.
    $(document).on("click", "#btn-clear", function () {

        localStorage.removeItem("pf-clients");
        location.reload();
        
    });

    //& Limpiar ruta.
    $(document).on("click", "#btn-noRoute", function () {

        clients = [];
        $(".client-item.selected").removeClass("selected");
        $(".client-selnum").hide();
        DrawRoute(clients);

    });

    //& Cambiar el símbolo para indicar la ruta.
    $(document).on("click", "#btn-routeSign", function () {

        $(this).children(".fa").toggleClass("fa-caret-right fa-circle");
        DrawRoute(clients);

    });

    //~ Cargar datos de depuración.
    $(document).on("keydown", function (e) {
        
        if (e.key === "F4") {

            localStorage.setItem("pf-clients", JSON.stringify(
                [{
                    "name": "Casa",
                    "desc": "Mi casa",
                    "zone": "Santa Lucía",
                    "lat": "25.572292715170715",
                    "lng": "-100.02538516368979"
                },
                {
                    "name": "Preparatoria 12",
                    "desc": "UANL No. 12",
                    "zone": "Chihuahua Km. 1",
                    "lat": "25.57376217449686",
                    "lng": "-99.98949022091044"
                },
                {
                    "name": "UT Cadereyta",
                    "desc": "Universidad Tecnológica Cadereyta",
                    "zone": "Chihuahua Km. 4.1",
                    "lat": "25.553976765013026",
                    "lng": "-99.96775062143396"
                }]
            ));
            
            alert("Datos de depuración cargados.");
            location.reload();

        }

    });

});

//& Función para crear el mapa con la ubicación de los clientes.
function CreateMap(data) {

    if (data.length < 1) return;

    //* Obtener los bordes del mapa.
    let points = [];
    data.forEach(client => {
        points.push([Number(client.lat), Number(client.lng)]);
    });
    const border = L.latLngBounds(points);

    //* Crear el mapa y agregar los marcadores de ubicación de los clientes.
    if (map) {
        map.remove();
        map = null;
    }

    map = L.map("map-container");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom : 19}).addTo(map);
    map.fitBounds(border);

    data.forEach(client => {

        L.marker([Number(client.lat), Number(client.lng)]).addTo(map)
            .bindPopup(`<b> ${client.name} </b> <br> <small> ${client.zone} </small>`);

    });

    //* Agregar evento para redibujar las rutas al modificar el zoom del mapa.
    map.on("zoomend", function () {
        DrawRoute(clients);
    });

}

//& Función para obtener la ruta entre los clientes seleccionados.
function DrawRoute(data) {

    $("#txt-dist").hide();

    //* Eliminar las rutas anteriores.
    map.eachLayer(function(layer) {

        if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) map.removeLayer(layer);

    });

    //* Trazar la ruta entre los puntos en orden.
    if (data.length < 2) return;

    let distance = 0;

    for (let i = 0; i < data.length - 1; i++) {

        const p1 = [data[i].lat, data[i].lng];
        const p2 = [data[i + 1].lat, data[i + 1].lng];

        //* Dibujar línea entre los puntos.
        DrawLine(p1, p2);
        distance += GetKMDistance(p1, p2);

    }

    $("#txt-dist").show()
    $("#dist-num").text(distance.toFixed(3));

}

//& Función para dibujar una ruta entre dos puntos.
function DrawLine(start, end) {

    //* Dibujar línea entre los puntos.
    L.polyline([start, end,], {
        color : $(":root").css("--bs-success")
    }).addTo(map);

    const size = 10;
    const gap = 35;

    if ($("#btn-routeSign .fa").hasClass("fa-caret-right")) {

        //* Convertir coordenadas a píxeles y obtener el ángulo de dirección.
        const p1 = map.latLngToLayerPoint(start);
        const p2 = map.latLngToLayerPoint(end);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const angle = Math.atan2(dy, dx);

        const angle1 = angle + Math.PI - DegToRad(gap);
        const angle2 = angle + Math.PI + DegToRad(gap);

        //* Obtener los puntos de la flecha.
        const p3 = L.point(
            p2.x + size * Math.cos(angle1),
            p2.y + size * Math.sin(angle1)
        );

        const p4 = L.point(
            p2.x + size * Math.cos(angle2),
            p2.y + size * Math.sin(angle2)
        );

        //* Convertir los puntos de píxeles a coordenadas y dibujar la flecha.
        const latlng3 = map.layerPointToLatLng(p3);
        const latlng4 = map.layerPointToLatLng(p4);

        L.polygon([ end, latlng3, latlng4,], {
            color : $(":root").css("--bs-success"),
            fillColor : $(":root").css("--bs-success"),
            fillOpacity : 1,
        }).addTo(map);
    
    } else {

        //* Dibujar un círculo en el punto final.
        L.circleMarker(end, {
            color : $(":root").css("--bs-success"),
            fillColor : $(":root").css("--bs-success"),
            fillOpacity: 1,
            radius: size * 0.75
        }).addTo(map);

    }

}

//& Función para calcular la distancia en km entre dos puntos.
function GetKMDistance(p1, p2) {

    //^ Radio de la Tierra en km.
    const R = 6371;

    const dLat = DegToRad(p2[0] - p1[0]);
    const dLng = DegToRad(p2[1] - p1[1]);

    //* Fórmula de Haversine.
    //* Al parecer, esta cosa convierte latitud y longitud en una distancia real.
    //* No pregunten de dónde lo saqué. IA vez como son las cosas.
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(DegToRad(p1[0])) * Math.cos(DegToRad(p2[0])) *
        Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;

}

//& Función para convertir grados a radianes.
function DegToRad(deg) { return deg * (Math.PI / 180) }