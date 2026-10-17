<?php

namespace App\Controllers;

/**
 * Serves the Svelte SPA shell. All UI routing happens client-side.
 */
class Home extends BaseController
{
    protected $helpers = ['vite'];

    public function index(): string
    {
        return view('app');
    }
}
