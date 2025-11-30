# CED Files Directory

This directory contains Course and Exam Description (CED) PDF files for AP courses.

## File Naming Convention

Place CED PDF files in this directory with the following naming convention:
- `ap-world-history.pdf` for AP World History: Modern
- `ap-chemistry.pdf` for AP Chemistry
- `ap-biology.pdf` for AP Biology
- etc.

The filename should match the course ID from the `apCourses.js` file.

## Supported Courses

The system will automatically discover and parse any PDF files placed in this directory. The course ID is extracted from the filename (without the .pdf extension).

## Testing

To test the system:
1. Place a CED PDF file in this directory
2. Start the backend server
3. Navigate to the Practice page for that course
4. The system will automatically parse the PDF and extract unit structure

## Notes

- Only PDF files are supported
- The system will attempt to extract unit structure automatically
- If no units are found, default units will be created based on content distribution
- CED files are parsed once on server startup
- Changes to CED files require server restart to take effect



