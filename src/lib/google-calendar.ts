/**
 * Google Calendar API helper.
 * Creates calendar events with Google Meet links via the REST API.
 */

export interface CalendarEventResult {
    success: boolean;
    meetLink?: string;
    eventLink?: string;
    error?: string;
}

interface CreateEventParams {
    accessToken: string;
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendeeEmails: string[];
    timeZone?: string;
}

/**
 * Creates a Google Calendar event with a Google Meet link.
 * The event is created on the authenticated user's primary calendar,
 * and invites are sent to all attendees automatically.
 */
export async function createCalendarEvent(params: CreateEventParams): Promise<CalendarEventResult> {
    const {
        accessToken,
        summary,
        description,
        startTime,
        endTime,
        attendeeEmails,
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    } = params;

    const event = {
        summary,
        description: description || 'TheraFlow therapy session',
        start: {
            dateTime: startTime.toISOString(),
            timeZone,
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone,
        },
        attendees: attendeeEmails.map((email) => ({ email })),
        conferenceData: {
            createRequest: {
                requestId: `theraflow-${Date.now()}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 60 },
                { method: 'popup', minutes: 15 },
            ],
        },
    };

    try {
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Google Calendar API error:', response.status, errorData);

            if (response.status === 401) {
                return { success: false, error: 'token_expired' };
            }

            return {
                success: false,
                error: errorData?.error?.message || `Calendar API error (${response.status})`,
            };
        }

        const data = await response.json();

        return {
            success: true,
            meetLink: data.conferenceData?.entryPoints?.find(
                (ep: { entryPointType: string }) => ep.entryPointType === 'video'
            )?.uri,
            eventLink: data.htmlLink,
        };
    } catch (error) {
        console.error('Failed to create calendar event:', error);
        return {
            success: false,
            error: 'Network error — could not reach Google Calendar.',
        };
    }
}
