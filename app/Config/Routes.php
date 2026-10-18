<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// SPA shell - all UI routing happens client-side (hash router).
$routes->get('/', 'Home::index');

$routes->group('api/v1', ['namespace' => 'App\\Controllers\\Api\\V1'], static function (RouteCollection $routes): void {
    $routes->get('operators', 'OperatorController::index');
    $routes->post('operators/login', 'OperatorController::login');

    $routes->get('motors', 'MotorController::index');
    $routes->get('motors/(:segment)', 'MotorController::show/$1');
    $routes->post('motors', 'MotorController::create');

    $routes->get('transaksi', 'TransaksiController::index');
    $routes->post('transaksi', 'TransaksiController::create');
    $routes->delete('transaksi/(:num)', 'TransaksiController::delete/$1');
});
