package main

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"time"
)

// Routes
const (
	homeRoute       = "/"
	notFoundRoute   = "/404"
	notAllowedRoute = "/405"
)

// Static File Path for the Routes
const (
	homeFile = "./src/index.html"
)

var httpServer *http.Server

func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, homeFile)
}

func run(ctx context.Context, w io.Writer) error {
	ctx, cancel := signal.NotifyContext(ctx)
	defer cancel()

	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("public"))
	mux.Handle("/public/", http.StripPrefix("/public/", fs))
	mux.HandleFunc(homeRoute, indexHandler)

	httpServer = &http.Server{
		Addr:    net.JoinHostPort("", "3000"),
		Handler: mux,
	}

	go func() {
		fmt.Fprintln(w, "Listening on", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Fprintln(w, "Error server closed\n\n%w", err)
		}
	}()

	var wg sync.WaitGroup
	wg.Add(1)

	go func() {
		defer wg.Done()
		<-ctx.Done()

		shutdownCtx := context.Background()
		shutdownCtx, cancel := context.WithTimeout(shutdownCtx, 10*time.Second)
		defer cancel()

		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			fmt.Fprintln(w, "Error occurred while shutting down the server\n\n%w", err)
		}
	}()

	wg.Wait()

	return nil
}

func main() {
	ctx := context.Background()

	if err := run(ctx, os.Stderr); err != nil {
		fmt.Fprintln(os.Stderr, "%s", err)
	}
}
