import socket
import sys

DEFAULT_HOST = "172.17.7.160"
DEFAULT_PORT = 5555

WELCOME_LINES = (
    "Безопасность массовых мероприятий.",
    "Команды: новое <формат> <участники> | персонал | маршруты | закрыть | помощь | пока",
)


def handle_request(text: str) -> str:
    t = text.strip()
    low = t.lower()

    if not hasattr(handle_request, "state"):
        handle_request.state = {
            "format": "",
            "participants": 0,
            "is_open": False,
        }
    state = handle_request.state

    if not t:
        return "Введите команду или «помощь»."

    if low in ("помощь", "help", "команды"):
        return (
            "Команды: новое <формат> <участники> | персонал | маршруты | "
            "закрыть | выход"
        )

    if low.startswith("новое "):
        parts = t.split()
        if len(parts) < 3:
            return "Формат: новое <внешнее|внутреннее> <число_участников>"

        event_format = parts[1].lower()
        if event_format not in ("внешнее", "внутреннее"):
            return "Формат мероприятия: внешнее или внутреннее."

        participants_text = parts[2]
        if not participants_text.isdigit():
            return "Количество участников укажите числом."

        participants = int(participants_text)
        state["format"] = event_format
        state["participants"] = participants
        state["is_open"] = True

        return (
            f"Карточка открыта: {event_format}, участников: {participants}. "
            "Теперь можно запросить «персонал» и «маршруты»."
        )

    if low == "персонал":
        if not state["is_open"]:
            return "Сначала откройте карточку: новое <формат> <участники>."

        participants = state["participants"]
        guards = max(4, (participants + 119) // 120)
        stewards = max(2, (participants + 199) // 200)
        coordinators = 1
        if state["format"] == "внешнее":
            guards += 2
            stewards += 1
        return (
            f"Состав смены: охрана — {guards}, контролеры потока — {stewards}, "
            f"координатор смены — {coordinators}."
        )

    if low == "маршруты":
        if not state["is_open"]:
            return "Нет активного мероприятия. Создайте: новое <формат> <участники>."
        participants = state["participants"]
        entrances = max(1, (participants + 499) // 500)
        exits = max(2, (participants + 249) // 250)
        if state["format"] == "внешнее":
            entrances += 1
        return (
            f"Потоки движения: входных групп — {entrances}, эвакуационных выходов — {exits}. "
        )

    if low == "закрыть":
        if not state["is_open"]:
            return "Активное мероприятие отсутствует."
        closed_format = state["format"]
        closed_participants = state["participants"]
        state["format"] = ""
        state["participants"] = 0
        state["is_open"] = False
        return (
            f"Карточка закрыта: {closed_format}, {closed_participants} участников. "
        )

    return "Неизвестная команда. Напишите «помощь»."


def main() -> None:
    host = DEFAULT_HOST
    port = DEFAULT_PORT
    if len(sys.argv) >= 2:
        host = sys.argv[1]
    if len(sys.argv) >= 3:
        port = int(sys.argv[2])

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((host, port))
    server_socket.listen(2)
    print(f"Сервер слушает {host}:{port} (ожидание клиента...)")

    conn, address = server_socket.accept()
    print("Подключение от:", address)

    try:
        read_f = conn.makefile("r", encoding="utf-8", newline="\n")
        write_f = conn.makefile("w", encoding="utf-8", newline="\n")

        for line in WELCOME_LINES:
            write_f.write(line + "\n")
            write_f.flush()

        while True:
            raw = read_f.readline()
            if not raw:
                break
            text = raw.strip()
            print("От клиента:", repr(text))

            if text.lower() in ("выход"):
                write_f.write("Сессия завершена.\n")
                write_f.flush()
                break

            answer = handle_request(text)
            write_f.write(answer + "\n")
            write_f.flush()

        read_f.close()
        write_f.close()
    finally:
        conn.close()
        server_socket.close()
        print("Сервер завершил работу.")


if __name__ == "__main__":
    main()
