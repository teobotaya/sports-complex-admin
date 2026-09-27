import sys; sys.path.insert(0, "/home/claude/diagkit")
from seqkit import Seq

def login():
    s = Seq("Diagrama de Secuencia — CU-10 Iniciar sesión",
            "UML · mensajes reales entre capas (React → API ASP.NET Core → servicios → SQL Server) · línea llena = llamada, punteada = respuesta")
    s.actor("E", ["Empleado /", "Administrador"])
    s.part("F", ["Frontend", "Login.tsx · AuthContext"])
    s.part("C", ["AuthController", "POST /api/auth/login"])
    s.part("U", ["UsuarioService"])
    s.part("J", ["JwtTokenService"])
    s.part("B", ["Base de datos", "SQL Server · tabla Usuario"])
    s.msg("E", "F", "ingresa usuario y contraseña")
    s.msg("F", "C", "POST /api/auth/login {username, password}")
    s.msg("C", "U", "LoginAsync(request)")
    s.msg("U", "B", "buscar usuario por username")
    s.ret("B", "U", "usuario (o ninguno)")
    def mal():
        s.ret("U", "C", "UnauthorizedException")
        s.ret("C", "F", "401 · «Usuario o contraseña inválidos.»")
        s.ret("F", "E", "muestra el error sin decir qué dato falló")
    def ok():
        s.self_("U", "VerifyHashedPassword(hash, contraseña)")
        s.msg("U", "J", "GenerateToken(usuario)")
        s.ret("J", "U", "token JWT (vence en 120 min)")
        s.ret("U", "C", "LoginResponse(token, usuario)")
        s.ret("C", "F", "200 OK · token + usuario")
        s.self_("F", "guarda token y usuario (localStorage)")
        s.ret("F", "E", "abre la pantalla de inicio según el rol")
    s.alt([("[no existe, está inactivo o la contraseña no coincide]", mal), ("[credenciales válidas]", ok)])
    return s.render()

def reserva():
    s = Seq("Diagrama de Secuencia — CU-01 Registrar reserva",
            "UML · incluye la regla de turnos por horas enteras y la validación de disponibilidad (reservas y partidos)")
    s.actor("E", ["Empleado /", "Administrador"])
    s.part("F", ["Frontend", "NuevaReserva.tsx"])
    s.part("C", ["ReservasController", "POST /api/reservas"])
    s.part("S", ["ReservaService"])
    s.part("H", ["ReglasHorario"])
    s.part("D", ["DisponibilidadService"])
    s.part("B", ["Base de datos", "SQL Server"])
    s.msg("E", "F", "elige cliente, cancha, fecha y horas enteras (+ observaciones)")
    s.msg("F", "C", "POST /api/reservas (token JWT)")
    s.msg("C", "S", "CreateAsync(dto, idUsuario)")
    s.msg("S", "H", "ValidarTurno(horaInicio, horaFin)")
    def fraccion():
        s.ret("H", "S", "BusinessRuleException")
        s.ret("S", "C", "error de regla de negocio")
        s.ret("C", "F", "400 · «Los turnos solo pueden empezar y terminar en horas enteras…»")
        s.ret("F", "E", "muestra el aviso en rojo")
    def valido():
        s.ret("H", "S", "turno válido")
        s.msg("S", "B", "¿existe el cliente? ¿la cancha está activa?")
        s.ret("B", "S", "sí")
        s.msg("S", "D", "ValidarDisponibilidadReservaAsync(cancha, fecha, inicio, fin)")
        s.msg("D", "B", "buscar reservas no canceladas y partidos superpuestos")
        s.ret("B", "D", "resultado")
        def ocupado():
            s.ret("D", "S", "ConflictException")
            s.ret("S", "C", "conflicto")
            s.ret("C", "F", "409 · «Ya existe una reserva en esa cancha, fecha y horario.»")
            s.ret("F", "E", "pide elegir otra hora o cancha")
        def libre():
            s.ret("D", "S", "sin superposición")
            s.msg("S", "B", "INSERT Reserva (Confirmada, pago Pendiente)")
            s.ret("B", "S", "id_reserva")
            s.ret("S", "C", "ReservaDto")
            s.ret("C", "F", "200 OK · reserva creada")
            s.ret("F", "E", "«Reserva registrada correctamente.»")
        s.alt([("[el horario se superpone]", ocupado), ("[horario libre]", libre)])
    s.alt([("[alguna hora no es entera o el fin no es posterior al inicio]", fraccion), ("[horas enteras y fin posterior al inicio]", valido)])
    return s.render()

def pago():
    s = Seq("Diagrama de Secuencia — CU-03 Registrar pago",
            "UML · el estado de pago de la reserva se recalcula en cada pago: Pendiente, Parcialmente abonado o Abonado")
    s.actor("E", ["Empleado /", "Administrador"])
    s.part("F", ["Frontend", "Pagos.tsx"])
    s.part("C", ["PagosController", "POST /api/pagos"])
    s.part("S", ["PagoService"])
    s.part("B", ["Base de datos", "SQL Server"])
    s.msg("E", "F", "elige la reserva, escribe el monto y el método")
    s.msg("F", "C", "POST /api/pagos {idReserva, monto, metodoPago}")
    s.msg("C", "S", "RegistrarAsync(dto, idUsuario)")
    def invalido():
        s.ret("S", "C", "BusinessRuleException")
        s.ret("C", "F", "400 · monto mayor a cero / método obligatorio")
        s.ret("F", "E", "muestra el error")
    def valido():
        s.msg("S", "B", "buscar la reserva con su cancha")
        s.ret("B", "S", "reserva + precio por hora")
        def cancelada():
            s.ret("S", "C", "BusinessRuleException")
            s.ret("C", "F", "400 · «No pueden registrarse pagos sobre reservas canceladas.»")
            s.ret("F", "E", "muestra el error")
        def excede():
            s.ret("S", "C", "BusinessRuleException")
            s.ret("C", "F", "400 · «El monto supera el saldo pendiente…»")
            s.ret("F", "E", "muestra el error")
        def activa():
            s.msg("S", "B", "INSERT Pago (fecha del día, usuario que cobra)")
            s.msg("S", "B", "INSERT Auditoria (Alta de Pago, usuario, fecha y hora)")
            s.msg("S", "B", "sumar los pagos de la reserva")
            s.ret("B", "S", "total abonado")
            s.self_("S", "estado = Pendiente / Parcialmente abonado / Abonado")
            s.msg("S", "B", "UPDATE Reserva.estado_pago + INSERT Auditoria")
            s.ret("S", "C", "PagoDto (con «registrado por»)")
            s.ret("C", "F", "200 OK")
            s.ret("F", "E", "muestra el nuevo estado de pago")
        def vigente():
            s.msg("S", "B", "sumar lo ya abonado")
            s.ret("B", "S", "total abonado")
            s.self_("S", "saldo = precio por hora × horas − abonado")
            s.alt([("[monto > saldo o saldo = 0]", excede), ("[monto ≤ saldo]", activa)])
        s.alt([("[la reserva está cancelada]", cancelada), ("[la reserva está activa]", vigente)])
    s.alt([("[monto ≤ 0 o sin método de pago]", invalido), ("[datos correctos]", valido)])
    return s.render()

def cancelacion():
    s = Seq("Diagrama de Secuencia — CU-02 Cancelar reserva y CU-04 Registrar devolución",
            "UML · la devolución es opcional: sólo corresponde si la reserva cancelada tenía pagos (extensión del CU-02)")
    s.actor("E", ["Empleado /", "Administrador"])
    s.part("F", ["Frontend", "Reservas.tsx · Cancelaciones.tsx"])
    s.part("RC", ["ReservasController", "POST …/{id}/cancelar"])
    s.part("CS", ["CancelacionService"])
    s.part("DC", ["DevolucionesController", "POST /api/devoluciones"])
    s.part("DS", ["DevolucionService"])
    s.part("B", ["Base de datos", "SQL Server"])
    s.msg("E", "F", "toca «Cancelar» y confirma")
    s.msg("F", "RC", "POST /api/reservas/{id}/cancelar")
    s.msg("RC", "CS", "CancelarReservaAsync(id, idUsuario, motivo)")
    s.msg("CS", "B", "buscar la reserva")
    s.ret("B", "CS", "reserva")
    def ya():
        s.ret("CS", "RC", "BusinessRuleException")
        s.ret("RC", "F", "400 · «Una reserva ya cancelada no puede volver a cancelarse.»")
        s.ret("F", "E", "muestra el error")
    def ok():
        s.msg("CS", "B", "UPDATE estado = Cancelada · INSERT Cancelacion (usuario)")
        s.msg("CS", "B", "INSERT Auditoria (cambio de estado y alta de la cancelación)")
        s.ret("CS", "RC", "CancelacionDto")
        s.ret("RC", "F", "200 OK")
        s.ret("F", "E", "la reserva figura Cancelada y el horario queda libre")
    s.alt([("[ya estaba cancelada]", ya), ("[reserva activa]", ok)])
    def devol():
        s.msg("E", "F", "«Registrar devolución»: monto (total o parcial) y método")
        s.msg("F", "DC", "POST /api/devoluciones {idCancelacion, monto, método}")
        s.msg("DC", "DS", "RegistrarAsync(dto, idUsuario)")
        s.msg("DS", "B", "¿existe la cancelación? ¿ya tiene devolución? total pagado")
        s.ret("B", "DS", "datos")
        def rech():
            s.ret("DS", "DC", "excepción")
            s.ret("DC", "F", "400 / 409 · sin pagos, ya devuelta o monto mayor al abonado")
            s.ret("F", "E", "muestra el error")
        def acep():
            s.msg("DS", "B", "INSERT Devolucion (usuario) + INSERT Auditoria")
            s.ret("DS", "DC", "DevolucionDto")
            s.ret("DC", "F", "200 OK")
            s.ret("F", "E", "la devolución figura Realizada")
        s.alt([("[no corresponde]", rech), ("[corresponde]", acep)])
    s.alt([("[la reserva cancelada tenía pagos]", devol)], op="opt")
    return s.render()

if __name__ == "__main__":
    for name, fn in (("09_secuencia_login", login), ("10_secuencia_reserva", reserva),
                     ("11_secuencia_pago", pago), ("12_secuencia_cancelacion", cancelacion)):
        d = fn(); P = d.verify(verbose=True)
        print(name, "\n".join(P) or "OK")
        d.save("/home/claude/out/" + name)
