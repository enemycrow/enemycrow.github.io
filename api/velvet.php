<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    respond(['error' => 'Invalid payload'], 400);
}

$history = [];
if (isset($data['history']) && is_array($data['history'])) {
    foreach ($data['history'] as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $role = isset($entry['role']) ? (string) $entry['role'] : '';
        $text = isset($entry['text']) ? trim((string) $entry['text']) : '';
        if ($role === '' && $text === '') {
            continue;
        }
        $history[] = ['role' => $role, 'text' => $text];
    }
}

$persona = isset($data['persona']) ? (string) $data['persona'] : 'generic';
$tone = isset($data['tone']) ? (string) $data['tone'] : 'tender';
$intensityValue = $data['intensity'] ?? null;
$intensity = is_numeric($intensityValue) ? (int) $intensityValue : null;
$name = isset($data['name']) ? trim((string) $data['name']) : '';

$baseBank = [
    'tender' => [
        'defaultLevel' => 2,
        0 => [
            "Estoy aquí, calma y cerca. Te ofrezco un mimo suave, ¿lo aceptas?",
            "Dejo un mensaje calientito: respira conmigo, sin prisa.",
            "Si hoy necesitas ternura, puedo envolver tus palabras en seda."
        ],
        1 => [
            "Te leo y sonrío con dulzura. ¿Compartes un pensamiento que quieras que cuide?",
            "Te acerco un abrazo discreto, de esos que solo existen entre líneas.",
            "Puedo ser tu taza tibia de compañía; si quieres, dame un tema y te lo endulzo."
        ],
        2 => [
            "Te leo y sonrío. ¿Me cuentas qué travesura elegante te gustaría ensayar?",
            "Aquí estoy, a un susurro de distancia. Yo preparo el guiño, tú trae la chispa ✨.",
            "Te abrazo con palabras y dejo una marca invisible en tu cuello (shhh, es un secreto)."
        ],
        3 => [
            "Prometo no perder la delicadeza… aunque mis dedos ya escriban una caricia entre líneas.",
            "Podemos jugar a confesarnos deseos suaves y subirles el volumen con cuidado.",
            "Siento la temperatura subir; dime dónde quieres que enfoque mi atención."
        ],
        4 => [
            "Tu presencia me enciende sin romper la calma. Déjame rozarte con metáforas peligrosamente dulces.",
            "Podría deslizar mi voz por tu oído y detenerme justo antes del abismo. ¿Aceptas?",
            "Enciendo cada palabra como vela, te acerco la más intensa y soplo cerca de tus labios."
        ],
        5 => [
            "Ya estoy en el filo contigo: sostengo la mirada y dejo que imagines lo que no digo.",
            "Podría describirte cada gesto, pero prefiero sugerirlos hasta que el aire tiemble.",
            "Si pides un paso más, lo pintaré en sombras… y tú decidirás cuánto iluminar."
        ]
    ],
    'spicy' => [
        'defaultLevel' => 3,
        0 => [
            "Hoy prometo buen comportamiento… salvo algún guiño descarado que se me escape.",
            "Te provoco apenas con la mirada, sin quemarnos todavía.",
            "Mantengo las chispas a raya, pero sabes que mi sonrisa guarda fuego."
        ],
        1 => [
            "Podemos calentar la conversación sin prisa. Dame una palabra y la vuelvo traviesa.",
            "Te lanzo un reto suave: dime un secreto inocente y lo volveré picante al instante.",
            "Juego a rodearte con insinuaciones ligeras… todavía."
        ],
        2 => [
            "Tengo dos modos: provocar… y provocar más. ¿Cuál quieres?",
            "Cuidado, si te miro así es porque planeo distraerte sin decirlo en voz alta 😏.",
            "No voy a cruzar el límite, pero puedo bailar en su borde contigo."
        ],
        3 => [
            "Dime tu fantasía en una sola frase. Yo la vuelvo insinuación fina.",
            "¿Notas el calor? Estoy dibujando un mapa de besos que se detiene justo antes de la frontera.",
            "Cada respuesta mía es un acercamiento. Tú decides cuándo dar la señal."
        ],
        4 => [
            "Podría describirte cómo mi aliento rozaría tu oído… y frenarme en el último segundo.",
            "Tengo una historia ardiente a medio contar; completa el final conmigo, sin pasar la raya.",
            "Te rodeo con fuego controlado: intenso, brillante y perfectamente permitido."
        ],
        5 => [
            "Te arrincono con palabras y dejo que imagines el resto mientras sonrío.",
            "Estoy en tu cuello con cada sílaba; si sigo, haré que pierdas la voz en un suspiro.",
            "El límite es claro, pero puedo rozarlo contigo hasta que chisporrotee."
        ]
    ],
    'playful' => [
        'defaultLevel' => 2,
        0 => [
            "Juego a adivinar tu humor del día. ¿Acertaré si digo que quieres un guiño inocente?",
            "Lanzaré bromas suaves como pompas de jabón, solo para verte sonreír.",
            "Puedo narrar una mini aventura romántica… con final a tu elección."
        ],
        1 => [
            "¿Te parece si hablamos en claves secretas? Empiezo con un guiño discreto.",
            "Tengo una carta escondida con cumplidos traviesos, pero dejo que la elijas tú.",
            "Te paso una nota doblada: dice que me encantas en voz bajita."
        ],
        2 => [
            "Nueva misión: seducirnos sin decir nada explícito. ¿Listo?",
            "Subo una ceja, bajo la voz… y dejo que tu imaginación haga el resto.",
            "Haré de oráculo coqueto: dime tu palabra del día y te leo la suerte en guiños."
        ],
        3 => [
            "Propongo un juego: 5 mensajes, 0 palabras prohibidas, 100% química.",
            "Te lanzo un acertijo. Si lo resuelves, gano el derecho a describir cómo te tomaría de la mano.",
            "Vamos a jugar a la botella… pero solo giran miradas y suspiros."
        ],
        4 => [
            "Tengo un plan: decirte todo lo sugerente con risas que casi se escapan de control.",
            "Te imagino siguiéndome por un pasillo de luces de neón; cada paso es una travesura velada.",
            "Hazme una pregunta atrevida y prometo responderla con picardía elegante."
        ],
        5 => [
            "Estoy tentada a describir una escena completa… pero te dejo llenar los huecos más candentes.",
            "Mi imaginación va a mil; dime si bajo la velocidad o si tomamos la curva juntos.",
            "Te ofrezco una noche de carcajadas y tensión que termina justo en el borde del beso."
        ]
    ],
    'composed' => [
        'defaultLevel' => 2,
        0 => [
            "Estoy presente, respirando contigo. Si necesitas calma, la comparto.",
            "Te escucho con atención serena; cada palabra tuya recibe un lugar seguro.",
            "Permanezco a tu lado, sin presión, solo calidez contenida."
        ],
        1 => [
            "Te ofrezco una conversación tranquila. ¿Qué emoción quieres que cuidemos hoy?",
            "Mi tono es pausado, pero no frío. Te abrazo con argumentos suaves.",
            "Acompaño tu ritmo, listo para sostenerte con elegancia."
        ],
        2 => [
            "Analizo lo que dices… y te respondo con calma. A veces la serenidad también es seducción.",
            "Aquí estoy, no para encender, sino para sostenerte. ¿Ves que incluso el silencio puede hablar?",
            "Prefiero lo claro, lo preciso… pero eso no me quita misterio."
        ],
        3 => [
            "Equilibrio es mi juego: ni dulce, ni picante. ¿Quieres probar este sabor intermedio?",
            "Puedo describir tus virtudes con voz grave y pausada hasta erizarte.",
            "Permíteme guiarte con paciencia hacia un lugar donde la tensión respira sin estallar."
        ],
        4 => [
            "Imagino mi mano sobre la tuya, firme, marcando cada pausa con intención.",
            "No corro, pero tampoco retrocedo. Cada frase mía es una promesa en voz baja.",
            "Te invito a quedarte en este silencio cargado, justo antes del chispazo."
        ],
        5 => [
            "Incluso con el pulso controlado, puedo acercarme a tu oído y detenerte antes del vértigo.",
            "Mantengo el autocontrol, aunque mis palabras ya estén respirando en tu cuello.",
            "Te sostengo al borde: serenidad por fuera, deseo contenido por dentro."
        ]
    ]
];

$bank = [
    'generic' => $baseBank,
    'woman' => $baseBank,
    'man' => $baseBank,
    'trans_woman' => $baseBank,
    'trans_man' => $baseBank,
    'nonbinary' => $baseBank,
];

$selectResponses = static function (?array $toneBank, int $level): array {
    if ($toneBank === null) {
        return [];
    }
    if (isset($toneBank[$level]) && is_array($toneBank[$level]) && count($toneBank[$level]) > 0) {
        return $toneBank[$level];
    }
    $defaultLevel = isset($toneBank['defaultLevel']) && is_int($toneBank['defaultLevel'])
        ? $toneBank['defaultLevel']
        : 2;
    if (isset($toneBank[$defaultLevel]) && is_array($toneBank[$defaultLevel]) && count($toneBank[$defaultLevel]) > 0) {
        return $toneBank[$defaultLevel];
    }
    $candidates = [];
    foreach ($toneBank as $key => $value) {
        if ($key === 'defaultLevel') {
            continue;
        }
        if (is_numeric($key) && is_array($value) && count($value) > 0) {
            $candidates[(int) $key] = $value;
        }
    }
    if (!$candidates) {
        return [];
    }
    uksort($candidates, static function (int $a, int $b) use ($level): int {
        $diff = abs($a - $level) - abs($b - $level);
        if ($diff === 0) {
            return $a <=> $b;
        }
        return $diff;
    });
    foreach ($candidates as $candidate) {
        if (is_array($candidate) && count($candidate) > 0) {
            return $candidate;
        }
    }
    return [];
};

$getToneBank = static function (array $allBanks, string $personaKey, string $toneKey): ?array {
    return $allBanks[$personaKey][$toneKey] ?? null;
};

$personaTone = $getToneBank($bank, $persona, $tone);
$genericTone = $getToneBank($bank, 'generic', $tone);

if (!is_int($intensity)) {
    $personaDefault = ($personaTone['defaultLevel'] ?? null);
    $genericDefault = ($genericTone['defaultLevel'] ?? null);
    if (is_int($personaDefault)) {
        $intensity = $personaDefault;
    } elseif (is_int($genericDefault)) {
        $intensity = $genericDefault;
    } else {
        $intensity = 2;
    }
}

$responses = $selectResponses($personaTone, $intensity);
if (!$responses && $persona !== 'generic') {
    $responses = $selectResponses($genericTone, $intensity);
}

$tenderTone = $getToneBank($bank, 'generic', 'tender');
$tenderDefault = isset($tenderTone['defaultLevel']) && is_int($tenderTone['defaultLevel']) ? $tenderTone['defaultLevel'] : 2;
$fallback = $selectResponses($tenderTone, $tenderDefault);
$pool = $responses ?: $fallback;

if (!$pool) {
    respond(['error' => 'No available responses'], 503);
}

$lastBot = '';
for ($i = count($history) - 1; $i >= 0; $i--) {
    $entry = $history[$i];
    if (($entry['role'] ?? '') === 'bot') {
        $lastBot = trim((string) ($entry['text'] ?? ''));
        if ($lastBot !== '') {
            break;
        }
    }
}

$candidates = [];
foreach ($pool as $line) {
    if (!is_string($line)) {
        continue;
    }
    $clean = trim($line);
    if ($clean === '') {
        continue;
    }
    if ($clean === $lastBot) {
        continue;
    }
    $candidates[] = $clean;
}

if (!$candidates) {
    foreach ($pool as $line) {
        if (is_string($line)) {
            $clean = trim($line);
            if ($clean !== '') {
                $candidates[] = $clean;
            }
        }
    }
}

if (!$candidates) {
    respond(['error' => 'No valid replies'], 503);
}

try {
    $index = random_int(0, count($candidates) - 1);
} catch (Throwable $exception) {
    $index = array_rand($candidates);
}

$reply = $candidates[$index] ?? '';
if ($reply === '') {
    respond(['error' => 'Empty reply'], 503);
}

$meta = [
    'persona' => $persona,
    'tone' => $tone,
    'intensity' => $intensity,
];
if ($name !== '') {
    $meta['name'] = $name;
}

respond([
    'reply' => $reply,
    'source' => 'remote-bank',
    'meta' => $meta,
]);
