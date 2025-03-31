<?php
// Определение предпочтительного языка пользователя
$userLang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);

// Определение подходящего редиректа
$redirectUrl = '/ru/'; // По умолчанию английский

if ($userLang == 'ru') {
    $redirectUrl = '/ru/';
} elseif ($userLang == 'bg') {
    $redirectUrl = '/bg/';
}

// Перенаправление на соответствующую языковую версию
header('Location: ' . $redirectUrl);
exit;
?>