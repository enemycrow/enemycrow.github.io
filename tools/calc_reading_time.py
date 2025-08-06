#!/usr/bin/env python3
"""Calcular y rellenar el campo de tiempo de lectura para cada post.

Este script abre ``posts.json``, calcula la cantidad de
palabras reales en ``contenido_html`` (eliminando las etiquetas HTML) y
estima el tiempo de lectura asumiendo una velocidad de 120 palabras por
minuto. Si un post no posee el campo ``tiempo`` o está vacío, se añade con
el formato ``"X min de lectura"``. El archivo se vuelve a guardar en UTF-8
con ``indent=2``.
"""
from __future__ import annotations

import html
import json
import math
import re
from pathlib import Path

# Ruta absoluta al archivo ``posts.json`` desde este script
POSTS_PATH = Path(__file__).resolve().parents[1] / "posts.json"

# Expresión regular simple para quitar etiquetas HTML
TAG_RE = re.compile(r"<[^>]+>")


def strip_html(text: str) -> str:
    """Eliminar etiquetas HTML y decodificar entidades."""
    # Decodificar entidades HTML como &amp;, &quot;, etc.
    text = html.unescape(text)
    # Reemplazar etiquetas por un espacio para evitar unir palabras
    return TAG_RE.sub(" ", text)


def words_from_html(html_text: str) -> list[str]:
    """Obtener una lista de palabras reales a partir de HTML."""
    stripped = strip_html(html_text)
    # Separar por espacios y eliminar elementos vacíos
    return [w for w in re.split(r"\s+", stripped) if w]


def main() -> None:
    with POSTS_PATH.open(encoding="utf-8") as f:
        posts = json.load(f)

    updated = False
    for post in posts:
        if not post.get("tiempo"):
            palabras = words_from_html(post.get("contenido_html", ""))
            minutos = math.ceil(len(palabras) / 120)
            post["tiempo"] = f"{minutos} min de lectura"
            updated = True

    if updated:
        with POSTS_PATH.open("w", encoding="utf-8") as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
    else:
        print("No se realizaron cambios: todos los posts tienen tiempo de lectura.")


if __name__ == "__main__":
    main()
