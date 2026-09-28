//
//  SafariWebExtensionHandler.swift
//  7TV for Safari Extension
//
import SafariServices

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        // This Safari build does not expose native commands. Returning an empty
        // response avoids logging or reflecting untrusted web-extension payloads.
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: [:]]
        } else {
            response.userInfo = ["message": [:]]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }

}
