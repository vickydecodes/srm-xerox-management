import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetDescription,
  SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import {
  AlertCircle,  Terminal,
  ChevronDown, Bold, Italic,
} from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="mb-12">
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      <Separator className="mb-4" />
      <div className="flex flex-wrap gap-3 items-start">
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [progress, setProgress] = useState(60)
  const [slider, setSlider] = useState([40])
  const [checked, setChecked] = useState(false)
  const [switched, setSwitched] = useState(false)

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">shadcn/ui components</h1>
          <p className="text-muted-foreground mt-1">All components in one place</p>
        </div>

        {/* buttons */}
        <Section title="Button">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </Section>

        {/* badge */}
        <Section title="Badge">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </Section>

        {/* input */}
        <Section title="Input">
          <Input placeholder="Default input" className="w-60" />
          <Input placeholder="Disabled" disabled className="w-60" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="labeled">Labeled input</Label>
            <Input id="labeled" placeholder="Enter value" className="w-60" />
          </div>
        </Section>

        {/* textarea */}
        <Section title="Textarea">
          <Textarea placeholder="Type something..." className="w-72" />
        </Section>

        {/* select */}
        <Section title="Select">
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pick an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
              <SelectItem value="b">Option B</SelectItem>
              <SelectItem value="c">Option C</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        {/* checkbox */}
        <Section title="Checkbox">
          <div className="flex items-center gap-2">
            <Checkbox id="check1" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="check1">Accept terms</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="check2" disabled />
            <Label htmlFor="check2">Disabled</Label>
          </div>
        </Section>

        {/* radio */}
        <Section title="Radio Group">
          <RadioGroup defaultValue="a">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="a" id="r1" />
              <Label htmlFor="r1">Option A</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="b" id="r2" />
              <Label htmlFor="r2">Option B</Label>
            </div>
          </RadioGroup>
        </Section>

        {/* switch */}
        <Section title="Switch">
          <div className="flex items-center gap-2">
            <Switch checked={switched} onCheckedChange={setSwitched} />
            <Label>{switched ? 'On' : 'Off'}</Label>
          </div>
        </Section>

        {/* slider */}
        <Section title="Slider">
          <div className="w-64">
            <Slider value={slider} onValueChange={setSlider} max={100} step={1} />
            <p className="text-xs text-muted-foreground mt-1">Value: {slider[0]}</p>
          </div>
        </Section>

        {/* progress */}
        <Section title="Progress">
          <div className="w-64 flex flex-col gap-2">
            <Progress value={progress} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
              <Button size="sm" variant="outline" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
            </div>
          </div>
        </Section>

        {/* avatar */}
        <Section title="Avatar">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>VK</AvatarFallback>
          </Avatar>
        </Section>

        {/* card */}
        <Section title="Card">
          <Card className="w-72">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">This is the card content area.</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button size="sm">Action</Button>
              <Button size="sm" variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </Section>

        {/* alert */}
        <Section title="Alert">
          <Alert className="w-80">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Default</AlertTitle>
            <AlertDescription>This is an informational alert.</AlertDescription>
          </Alert>
          <Alert variant="destructive" className="w-80">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong.</AlertDescription>
          </Alert>
        </Section>

        {/* tabs */}
        <Section title="Tabs">
          <Tabs defaultValue="tab1" className="w-80">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <p className="text-sm text-muted-foreground p-2">Content for tab 1</p>
            </TabsContent>
            <TabsContent value="tab2">
              <p className="text-sm text-muted-foreground p-2">Content for tab 2</p>
            </TabsContent>
            <TabsContent value="tab3">
              <p className="text-sm text-muted-foreground p-2">Content for tab 3</p>
            </TabsContent>
          </Tabs>
        </Section>

        {/* accordion */}
        <Section title="Accordion">
          <Accordion type="single" collapsible className="w-80">
            <AccordionItem value="a">
              <AccordionTrigger>What is shadcn?</AccordionTrigger>
              <AccordionContent>A component library built on Radix UI and Tailwind CSS.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Is it free?</AccordionTrigger>
              <AccordionContent>Yes, completely open source and free to use.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Can I customize it?</AccordionTrigger>
              <AccordionContent>Fully customizable — you own the code.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        {/* tooltip */}
        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>This is a tooltip</TooltipContent>
          </Tooltip>
        </Section>

        {/* dialog */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>This is the dialog description.</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Dialog body content goes here.</p>
              <DialogFooter>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        {/* sheet */}
        <Section title="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>This slides in from the side.</SheetDescription>
              </SheetHeader>
              <p className="text-sm text-muted-foreground mt-4">Sheet content here.</p>
            </SheetContent>
          </Sheet>
        </Section>

        {/* dropdown */}
        <Section title="Dropdown Menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Options <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        {/* popover */}
        <Section title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <p className="text-sm text-muted-foreground">This is popover content. You can put anything here.</p>
            </PopoverContent>
          </Popover>
        </Section>

        {/* toggle */}
        <Section title="Toggle">
          <Toggle aria-label="Bold"><Bold className="h-4 w-4" /></Toggle>
          <Toggle aria-label="Italic"><Italic className="h-4 w-4" /></Toggle>
          <Toggle disabled aria-label="Disabled">Disabled</Toggle>
        </Section>

        {/* scroll area */}
        <Section title="Scroll Area">
          <ScrollArea className="h-32 w-60 rounded-md border p-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <p key={i} className="text-sm text-muted-foreground py-0.5">Item {i + 1}</p>
            ))}
          </ScrollArea>
        </Section>

        {/* skeleton */}
        <Section title="Skeleton">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </Section>

        {/* table */}
        <Section title="Table">
          <Table className="w-full max-w-lg">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Vicky', role: 'Full Stack', status: 'Active' },
                { name: 'Arul',  role: 'Co-founder', status: 'Active' },
                { name: 'Dilip', role: 'Co-founder', status: 'Active' },
              ].map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        {/* separator */}
        <Section title="Separator">
          <div className="w-80 flex flex-col gap-3">
            <p className="text-sm">Above</p>
            <Separator />
            <p className="text-sm">Below</p>
            <div className="flex items-center gap-3 h-5">
              <span className="text-sm">Left</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Right</span>
            </div>
          </div>
        </Section>

      </div>
    </TooltipProvider>
  )
}