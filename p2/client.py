import socket
import sys

DEFAULT_HOST = "217.71.129.139"
DEFAULT_PORT = 4552
WELCOME_LINE_COUNT = 2


def main() -> None:
    host = DEFAULT_HOST
    port = DEFAULT_PORT
    if len(sys.argv) >= 2:
        host = sys.argv[1]
    if len(sys.argv) >= 3:
        port = int(sys.argv[2])

    print("Подключение к серверу…")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect((host, port))
    except ConnectionRefusedError:
        print(
            f"Отказ в соединении: {host}:{port} — на этом адресе никто не слушает "
            "(сервер не запущен или другой порт).",
            file=sys.stderr,
        )
        sys.exit(1)

    read_f = sock.makefile("r", encoding="utf-8", newline="\n")
    write_f = sock.makefile("w", encoding="utf-8", newline="\n")

    try:
        for _ in range(WELCOME_LINE_COUNT):
            line = read_f.readline()
            if line:
                print(line.rstrip("\n"))

        while True:
            try:
                user = input("> ")
            except EOFError:
                break
            except KeyboardInterrupt:
                print("\nВыход по Ctrl+C.")
                break

            text = user.strip()
            write_f.write(text + "\n")
            write_f.flush()

            reply = read_f.readline()
            if not reply:
                break
            print(reply.rstrip("\n"))

            if text.lower() in ("выход"):
                break
    except KeyboardInterrupt:
        print("\nВыход по Ctrl+C.")
    finally:
        read_f.close()
        write_f.close()
        sock.close()


if __name__ == "__main__":
    main()
