# Editorial Policy

## Portraits and Personal Data

**Inclusion:** All persons featured in the show are included on wikifela,
since the show aired on French public television and the information is
already in the public record.

**Takedown:** Any person depicted may request removal. Takedown requests
are honored within 7 days, no questions asked. Contact: [TODO: email].

**Implementation:** Removed portraits are not hard-deleted. The Portrait
row is retained with `takedownAt` set and personal fields scrubbed
(`personName`, `imagePath`, `subtitle` set to empty/null) so we have a
record of compliance and can prevent re-addition.

## Takedown procedure (operational)

When a takedown request is received:

1. In `/admin/portraits`, find the row for the person.
2. Click "Retirer (RGPD)", enter an optional internal reason, confirm.
3. The DB row is scrubbed but retained for compliance audit.
4. Manually delete the corresponding file from `public/portraits/` via SSH.
   (TODO: automate this in a future iteration.)
5. Reply to the requester confirming completion within 7 days of request.
