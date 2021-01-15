import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	private apiUrl = environment.apiUrl;
	// private initialized = false;

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (!request.url.startsWith('/api')) {
			return next.handle(request);
		}

		// if (!this.initialized && window.location.protocol === 'https:') {
			// this.apiUrl = window.location.origin.replace('https://', 'https://api-');
			// console.info(`Mapped /api to ${this.apiUrl}`);
			// this.initialized = true;
		// }

		const newUrl = request.url.replace('/api', this.apiUrl);
		return next.handle(request.clone({ url: newUrl, withCredentials: true }));
	}
}
