# Files

- [Controls and Vehicle Integration](controls-and-vehicles.md) - How StarPilot selects vehicle interfaces, plans longitudinal behavior, computes lateral control, and hands constrained actuator commands to vehicle-specific code.
- [Galaxy Device Management Service](galaxy.md) - Galaxy is StarPilot's Flask-based device-management service with classic and mobile frontends for settings, diagnostics, routes, notifications, and controlled update workflows.
- [Navigation, Routes, and Media](navigation-and-media.md) - Navigation state, route recordings, replay, and WebRTC media cross the messaging, device-storage, Galaxy API, and UI boundaries.
- [Runtime Architecture Overview](overview.md) - StarPilot extends openpilot's supervised process graph with vehicle, control, settings, UI, navigation, and Galaxy subsystems connected by cereal messaging and persistent Params.
- [Runtime Processes and Messaging](runtime-and-messaging.md) - Manager-supervised daemons communicate through cereal service schemas and PubMaster/SubMaster, with loggerd and selfdrived providing important lifecycle boundaries.
- [Settings, Parameters, and Feature State](settings-and-parameters.md) - StarPilot settings flow from registered parameter keys and UI metadata through typed persistence, migrations, Galaxy APIs, and runtime toggle snapshots.
