$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$calendar = $namespace.GetDefaultFolder(9)

$items = $calendar.Items
$items.IncludeRecurrences = $true
$items.Sort("[Start]")

$rangeStart = (Get-Date).AddDays(-30)
$rangeEnd = (Get-Date).AddDays(30)

$filterStart = $rangeStart.ToString("g")
$filterEnd = $rangeEnd.ToString("g")

$filter = "[Start] >= '$filterStart' AND [Start] <= '$filterEnd'"
$events = $items.Restrict($filter)

$result = foreach ($event in $events) {
    [PSCustomObject]@{
        id = $event.EntryID
        title = $event.Subject
        start = $event.Start.ToString("o")
        end = $event.End.ToString("o")
        location = $event.Location
        source = "Outlook"
        allDay = $event.AllDayEvent
    }
}

$result | ConvertTo-Json -Depth 4