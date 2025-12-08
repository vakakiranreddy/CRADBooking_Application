# Save Room Button - Why It's Disabled

## The Issue
The "Save Room" button appears disabled when the room form first opens.

## Why This Happens
The button is disabled because of form validation:

```html
<button [disabled]="roomForm.invalid || saving">
  Save Room
</button>
```

The `roomForm` is **invalid** by default because:
- The `roomName` field is **required** (marked with `*`)
- The field is **empty** when the form first loads
- Angular's reactive forms mark the form as invalid until all required fields are filled

## The Solution
**You need to enter a Room Name** to enable the button.

### What I Added:
1. **Visual Feedback**: The Room Name field now shows a red border when touched but empty
2. **Helper Text**: A message appears below the button saying "Please fill in required fields (*)" when the form is invalid

### How It Works Now:
1. Click "Edit Room Details" button
2. The form opens with the "Save Room" button **disabled**
3. Type a room name in the "Room Name *" field
4. The button **automatically enables** once you've entered a name
5. You can now click "Save Room"

## Form Validation Rules
- **Room Name**: Required (must not be empty)
- **Capacity**: Required, must be at least 1 (default value: 1)
- All other fields are optional

## Alternative Solutions (Not Implemented)
If you want the button enabled immediately, you could:
1. Remove the required validator from roomName
2. Set a default room name (e.g., "New Room")
3. Remove the `roomForm.invalid` check from the button

However, the current approach is best practice because it ensures data quality - you can't save a room without a name.
