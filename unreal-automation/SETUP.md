# Instrucoes para ativar Rafaela no Unreal Editor

## METODO 1: ExecPython (Editor Aberto)

No console do Unreal Editor (tecla ~ ou `), digite:

```
ExecPython C:/Users/23GAMER/.openclaw/workspace/empresa/toposcan/unreal-automation/raffaela_bridge.py
```

## METODO 2: Python Script主动性 (auto-load)

Coloque o arquivo `raffaela_bridge.py` em:
```
C:/Users/23GAMER/Documents/Unreal Projects/Guaratuba/Content/Python/
```

## METODO 3: Editor Startup

Em Edit > Editor Preferences > Python, adicione o script no startup.

## COMANDOS DISPONIVEIS

O sistema monitora o arquivo `commands.txt`. Para enviar comandos:

1. Edite `commands.txt` com Python code
2. O bridge executa automaticamente

Exemplo de commands.txt:
```
unreal.log("Hello from Rafaela!")
import unreal
level = unreal.EditorLevelLibrary.get_editor_world()
unreal.log(f"Level: {level}")
```

## AUTO-LOAD

Para carregar automaticamente ao abrir o projeto, crie um arquivo `user_config.py` na pasta Content/Python do projeto.
