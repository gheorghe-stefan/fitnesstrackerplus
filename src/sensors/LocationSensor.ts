import { ISensor } from "../domain/ISensor";
import { LocationData } from "../domain/models";

export class LocationSensor implements ISensor<LocationData> {
  public name = "GPS Location";
  public onDisconnected: (() => void) | null = null;

  private watchId: number | null = null;
  private currentData: LocationData | null = null;

  async start(notification: (data: LocationData) => void): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser.");
    }

    return new Promise((resolve, reject) => {
      // We first try to get the current position to verify permission and start
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePosition(position, notification);
          
          // Then we set up continuous watching
          this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.handlePosition(pos, notification),
            (err) => console.error("Geolocation watch error:", err),
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000,
            }
          );
          resolve();
        },
        (error) => {
          let errorMessage = "Unknown location error.";
          if (error.code === error.PERMISSION_DENIED) errorMessage = "Location permission denied.";
          if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "Location information is unavailable.";
          if (error.code === error.TIMEOUT) errorMessage = "Location request timed out.";
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    });
  }

  private lastFetchCoords: { lat: number, lng: number } | null = null;
  private lastFetchedAltitude: number | null = null;
  private isFetchingElevation: boolean = false;

  private getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async fetchElevation(lat: number, lng: number): Promise<number | null> {
    try {
      this.isFetchingElevation = true;
      const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
      const data = await response.json();
      if (data && data.elevation && data.elevation.length > 0) {
        return data.elevation[0];
      }
    } catch (e) {
      console.warn("Failed to fetch elevation from Open-Meteo:", e);
    } finally {
      this.isFetchingElevation = false;
    }
    return null;
  }

  private handlePosition(position: GeolocationPosition, notification: (data: LocationData) => void) {
    let altitude = position.coords.altitude;

    // Fallback to OpenTopoData if hardware altitude is missing
    if (altitude === null || altitude === undefined) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!this.lastFetchCoords || this.getDistanceMeters(this.lastFetchCoords.lat, this.lastFetchCoords.lng, lat, lng) > 20) {
        if (!this.isFetchingElevation) {
          this.lastFetchCoords = { lat, lng };
          // Fetch async without blocking the GPS update loop
          this.fetchElevation(lat, lng).then(ele => {
            if (ele !== null) {
              this.lastFetchedAltitude = ele;
              // Push an immediate update with the new elevation once it arrives
              if (this.currentData) {
                this.currentData.altitude = ele;
                notification({ ...this.currentData });
              }
            }
          });
        }
      }
      altitude = this.lastFetchedAltitude ?? 0;
    }

    const data: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: altitude,
    };
    this.currentData = data;
    notification(data);
  }

  get Value(): LocationData | null {
    return this.currentData;
  }

  public disconnect(): void {
    this.stop();
    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }

  public stop(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
